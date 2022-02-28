/*
   Licensed to the Apache Software Foundation (ASF) under one or more
   contributor license agreements.  See the NOTICE file distributed with
   this work for additional information regarding copyright ownership.
   The ASF licenses this file to You under the Apache License, Version 2.0
   (the "License"); you may not use this file except in compliance with
   the License.  You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
var showControllersOnly = false;
var seriesFilter = "";
var filtersOnlySampleSeries = true;

/*
 * Add header in statistics table to group metrics by category
 * format
 *
 */
function summaryTableHeader(header) {
    var newRow = header.insertRow(-1);
    newRow.className = "tablesorter-no-sort";
    var cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Requests";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 3;
    cell.innerHTML = "Executions";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 7;
    cell.innerHTML = "Response Times (ms)";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 1;
    cell.innerHTML = "Throughput";
    newRow.appendChild(cell);

    cell = document.createElement('th');
    cell.setAttribute("data-sorter", false);
    cell.colSpan = 2;
    cell.innerHTML = "Network (KB/sec)";
    newRow.appendChild(cell);
}

/*
 * Populates the table identified by id parameter with the specified data and
 * format
 *
 */
function createTable(table, info, formatter, defaultSorts, seriesIndex, headerCreator) {
    var tableRef = table[0];

    // Create header and populate it with data.titles array
    var header = tableRef.createTHead();

    // Call callback is available
    if(headerCreator) {
        headerCreator(header);
    }

    var newRow = header.insertRow(-1);
    for (var index = 0; index < info.titles.length; index++) {
        var cell = document.createElement('th');
        cell.innerHTML = info.titles[index];
        newRow.appendChild(cell);
    }

    var tBody;

    // Create overall body if defined
    if(info.overall){
        tBody = document.createElement('tbody');
        tBody.className = "tablesorter-no-sort";
        tableRef.appendChild(tBody);
        var newRow = tBody.insertRow(-1);
        var data = info.overall.data;
        for(var index=0;index < data.length; index++){
            var cell = newRow.insertCell(-1);
            cell.innerHTML = formatter ? formatter(index, data[index]): data[index];
        }
    }

    // Create regular body
    tBody = document.createElement('tbody');
    tableRef.appendChild(tBody);

    var regexp;
    if(seriesFilter) {
        regexp = new RegExp(seriesFilter, 'i');
    }
    // Populate body with data.items array
    for(var index=0; index < info.items.length; index++){
        var item = info.items[index];
        if((!regexp || filtersOnlySampleSeries && !info.supportsControllersDiscrimination || regexp.test(item.data[seriesIndex]))
                &&
                (!showControllersOnly || !info.supportsControllersDiscrimination || item.isController)){
            if(item.data.length > 0) {
                var newRow = tBody.insertRow(-1);
                for(var col=0; col < item.data.length; col++){
                    var cell = newRow.insertCell(-1);
                    cell.innerHTML = formatter ? formatter(col, item.data[col]) : item.data[col];
                }
            }
        }
    }

    // Add support of columns sort
    table.tablesorter({sortList : defaultSorts});
}

$(document).ready(function() {

    // Customize table sorter default options
    $.extend( $.tablesorter.defaults, {
        theme: 'blue',
        cssInfoBlock: "tablesorter-no-sort",
        widthFixed: true,
        widgets: ['zebra']
    });

    var data = {"OkPercent": 70.296, "KoPercent": 29.704};
    var dataset = [
        {
            "label" : "KO",
            "data" : data.KoPercent,
            "color" : "#FF6347"
        },
        {
            "label" : "OK",
            "data" : data.OkPercent,
            "color" : "#9ACD32"
        }];
    $.plot($("#flot-requests-summary"), dataset, {
        series : {
            pie : {
                show : true,
                radius : 1,
                label : {
                    show : true,
                    radius : 3 / 4,
                    formatter : function(label, series) {
                        return '<div style="font-size:8pt;text-align:center;padding:2px;color:white;">'
                            + label
                            + '<br/>'
                            + Math.round10(series.percent, -2)
                            + '%</div>';
                    },
                    background : {
                        opacity : 0.5,
                        color : '#000'
                    }
                }
            }
        },
        legend : {
            show : true
        }
    });

    // Creates APDEX table
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.70296, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "HTTP Request-1"], "isController": false}, {"data": [1.0, 500, 1500, "HTTP Request-0"], "isController": false}, {"data": [0.10888, 500, 1500, "HTTP Request"], "isController": false}]}, function(index, item){
        switch(index){
            case 0:
                item = item.toFixed(3);
                break;
            case 1:
            case 2:
                item = formatDuration(item);
                break;
        }
        return item;
    }, [[0, 0]], 3);

    // Create statistics table
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 75000, 22278, 29.704, 12.979479999999981, 0, 390, 8.0, 20.0, 26.0, 44.0, 3769.4124742423483, 9581.522575639545, 620.8732786349701], "isController": false}, "titles": ["Label", "#Samples", "KO", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions\/s", "Received", "Sent"], "items": [{"data": ["HTTP Request-1", 25000, 0, 0.0, 8.616799999999916, 0, 209, 8.0, 17.0, 21.0, 43.0, 1260.9068442023504, 4672.226280766126, 156.38200118525242], "isController": false}, {"data": ["HTTP Request-0", 25000, 0, 0.0, 10.58399999999999, 0, 376, 9.0, 22.0, 28.0, 51.0, 1256.5339766787295, 134.97923577603538, 154.61257916164053], "isController": false}, {"data": ["HTTP Request", 25000, 22278, 89.112, 19.737640000000187, 0, 390, 18.0, 37.0, 46.0, 78.0, 1256.4708247474493, 4790.761287819772, 310.43663931748506], "isController": false}]}, function(index, item){
        switch(index){
            // Errors pct
            case 3:
                item = item.toFixed(2) + '%';
                break;
            // Mean
            case 4:
            // Mean
            case 7:
            // Median
            case 8:
            // Percentile 1
            case 9:
            // Percentile 2
            case 10:
            // Percentile 3
            case 11:
            // Throughput
            case 12:
            // Kbytes/s
            case 13:
            // Sent Kbytes/s
                item = item.toFixed(2);
                break;
        }
        return item;
    }, [[0, 0]], 0, summaryTableHeader);

    // Create error table
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["The operation lasted too long: It took 78 milliseconds, but should not have lasted longer than 5 milliseconds.", 6, 0.026932399676811204, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 118 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 16 milliseconds, but should not have lasted longer than 5 milliseconds.", 818, 3.671783822605261, 1.0906666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 145 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 74 milliseconds, but should not have lasted longer than 5 milliseconds.", 9, 0.04039859951521681, 0.012], "isController": false}, {"data": ["The operation lasted too long: It took 12 milliseconds, but should not have lasted longer than 5 milliseconds.", 868, 3.8962204865786876, 1.1573333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 43 milliseconds, but should not have lasted longer than 5 milliseconds.", 115, 0.5162043271388814, 0.15333333333333332], "isController": false}, {"data": ["The operation lasted too long: It took 47 milliseconds, but should not have lasted longer than 5 milliseconds.", 58, 0.260346530209175, 0.07733333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 60 milliseconds, but should not have lasted longer than 5 milliseconds.", 14, 0.06284226591255948, 0.018666666666666668], "isController": false}, {"data": ["The operation lasted too long: It took 6 milliseconds, but should not have lasted longer than 5 milliseconds.", 704, 3.160068228745848, 0.9386666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 95 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.017954933117874137, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 91 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.017954933117874137, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 186 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 26 milliseconds, but should not have lasted longer than 5 milliseconds.", 535, 2.4014723045156656, 0.7133333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 57 milliseconds, but should not have lasted longer than 5 milliseconds.", 41, 0.1840380644582099, 0.05466666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 88 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 233 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 53 milliseconds, but should not have lasted longer than 5 milliseconds.", 42, 0.18852679773767841, 0.056], "isController": false}, {"data": ["The operation lasted too long: It took 114 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.017954933117874137, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 80 milliseconds, but should not have lasted longer than 5 milliseconds.", 7, 0.03142113295627974, 0.009333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 120 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 84 milliseconds, but should not have lasted longer than 5 milliseconds.", 7, 0.03142113295627974, 0.009333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 182 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 81 milliseconds, but should not have lasted longer than 5 milliseconds.", 9, 0.04039859951521681, 0.012], "isController": false}, {"data": ["The operation lasted too long: It took 318 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 124 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 125 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 121 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 64 milliseconds, but should not have lasted longer than 5 milliseconds.", 17, 0.07630846575096507, 0.02266666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 134 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 193 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 63 milliseconds, but should not have lasted longer than 5 milliseconds.", 20, 0.08977466558937068, 0.02666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 67 milliseconds, but should not have lasted longer than 5 milliseconds.", 12, 0.05386479935362241, 0.016], "isController": false}, {"data": ["The operation lasted too long: It took 196 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 68 milliseconds, but should not have lasted longer than 5 milliseconds.", 8, 0.035909866235748274, 0.010666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 129 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 138 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 71 milliseconds, but should not have lasted longer than 5 milliseconds.", 10, 0.04488733279468534, 0.013333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 70 milliseconds, but should not have lasted longer than 5 milliseconds.", 12, 0.05386479935362241, 0.016], "isController": false}, {"data": ["The operation lasted too long: It took 197 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 48 milliseconds, but should not have lasted longer than 5 milliseconds.", 52, 0.23341413053236376, 0.06933333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 177 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 19 milliseconds, but should not have lasted longer than 5 milliseconds.", 742, 3.3306400933656524, 0.9893333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 17 milliseconds, but should not have lasted longer than 5 milliseconds.", 845, 3.792979621150911, 1.1266666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 175 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 179 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 42 milliseconds, but should not have lasted longer than 5 milliseconds.", 104, 0.4668282610647275, 0.13866666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 13 milliseconds, but should not have lasted longer than 5 milliseconds.", 885, 3.9725289523296525, 1.18], "isController": false}, {"data": ["The operation lasted too long: It took 44 milliseconds, but should not have lasted longer than 5 milliseconds.", 80, 0.3590986623574827, 0.10666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 90 milliseconds, but should not have lasted longer than 5 milliseconds.", 5, 0.02244366639734267, 0.006666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 15 milliseconds, but should not have lasted longer than 5 milliseconds.", 813, 3.649340156207918, 1.084], "isController": false}, {"data": ["The operation lasted too long: It took 46 milliseconds, but should not have lasted longer than 5 milliseconds.", 52, 0.23341413053236376, 0.06933333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 7 milliseconds, but should not have lasted longer than 5 milliseconds.", 817, 3.6672950893257923, 1.0893333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 11 milliseconds, but should not have lasted longer than 5 milliseconds.", 894, 4.01292755184487, 1.192], "isController": false}, {"data": ["The operation lasted too long: It took 9 milliseconds, but should not have lasted longer than 5 milliseconds.", 986, 4.425891013555974, 1.3146666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 94 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 92 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.017954933117874137, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 140 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 201 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 85 milliseconds, but should not have lasted longer than 5 milliseconds.", 6, 0.026932399676811204, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 87 milliseconds, but should not have lasted longer than 5 milliseconds.", 7, 0.03142113295627974, 0.009333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 89 milliseconds, but should not have lasted longer than 5 milliseconds.", 3, 0.013466199838405602, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 203 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 51 milliseconds, but should not have lasted longer than 5 milliseconds.", 37, 0.16608313134033575, 0.04933333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 22 milliseconds, but should not have lasted longer than 5 milliseconds.", 709, 3.1825118951431906, 0.9453333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 20 milliseconds, but should not have lasted longer than 5 milliseconds.", 758, 3.402459825837149, 1.0106666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 210 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 24 milliseconds, but should not have lasted longer than 5 milliseconds.", 612, 2.7471047670347426, 0.816], "isController": false}, {"data": ["The operation lasted too long: It took 229 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 107 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 96 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 98 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 109 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 35 milliseconds, but should not have lasted longer than 5 milliseconds.", 238, 1.068318520513511, 0.31733333333333336], "isController": false}, {"data": ["The operation lasted too long: It took 105 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 103 milliseconds, but should not have lasted longer than 5 milliseconds.", 3, 0.013466199838405602, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 37 milliseconds, but should not have lasted longer than 5 milliseconds.", 209, 0.9381452554089236, 0.2786666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 101 milliseconds, but should not have lasted longer than 5 milliseconds.", 5, 0.02244366639734267, 0.006666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 40 milliseconds, but should not have lasted longer than 5 milliseconds.", 140, 0.6284226591255948, 0.18666666666666668], "isController": false}, {"data": ["The operation lasted too long: It took 33 milliseconds, but should not have lasted longer than 5 milliseconds.", 277, 1.2433791184127838, 0.36933333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 31 milliseconds, but should not have lasted longer than 5 milliseconds.", 362, 1.6249214471676092, 0.4826666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 39 milliseconds, but should not have lasted longer than 5 milliseconds.", 172, 0.7720621240685879, 0.22933333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 18 milliseconds, but should not have lasted longer than 5 milliseconds.", 761, 3.4159260256755544, 1.0146666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 178 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 208 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 147 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 143 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 76 milliseconds, but should not have lasted longer than 5 milliseconds.", 11, 0.049376066074153874, 0.014666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 14 milliseconds, but should not have lasted longer than 5 milliseconds.", 885, 3.9725289523296525, 1.18], "isController": false}, {"data": ["The operation lasted too long: It took 41 milliseconds, but should not have lasted longer than 5 milliseconds.", 134, 0.6014902594487835, 0.17866666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 262 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 45 milliseconds, but should not have lasted longer than 5 milliseconds.", 95, 0.42642966154951073, 0.12666666666666668], "isController": false}, {"data": ["The operation lasted too long: It took 62 milliseconds, but should not have lasted longer than 5 milliseconds.", 37, 0.16608313134033575, 0.04933333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 10 milliseconds, but should not have lasted longer than 5 milliseconds.", 847, 3.801957087709848, 1.1293333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 8 milliseconds, but should not have lasted longer than 5 milliseconds.", 885, 3.9725289523296525, 1.18], "isController": false}, {"data": ["The operation lasted too long: It took 49 milliseconds, but should not have lasted longer than 5 milliseconds.", 54, 0.24239159709130084, 0.072], "isController": false}, {"data": ["The operation lasted too long: It took 93 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.017954933117874137, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 188 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 28 milliseconds, but should not have lasted longer than 5 milliseconds.", 511, 2.293742705808421, 0.6813333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 86 milliseconds, but should not have lasted longer than 5 milliseconds.", 11, 0.049376066074153874, 0.014666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 112 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 59 milliseconds, but should not have lasted longer than 5 milliseconds.", 27, 0.12119579854565042, 0.036], "isController": false}, {"data": ["The operation lasted too long: It took 204 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 55 milliseconds, but should not have lasted longer than 5 milliseconds.", 38, 0.17057186461980428, 0.050666666666666665], "isController": false}, {"data": ["The operation lasted too long: It took 116 milliseconds, but should not have lasted longer than 5 milliseconds.", 3, 0.013466199838405602, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 200 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 239 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 181 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 180 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 83 milliseconds, but should not have lasted longer than 5 milliseconds.", 7, 0.03142113295627974, 0.009333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 82 milliseconds, but should not have lasted longer than 5 milliseconds.", 6, 0.026932399676811204, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 69 milliseconds, but should not have lasted longer than 5 milliseconds.", 13, 0.05835353263309094, 0.017333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 127 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 122 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.017954933117874137, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 123 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 194 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 66 milliseconds, but should not have lasted longer than 5 milliseconds.", 19, 0.08528593230990214, 0.025333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 195 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 65 milliseconds, but should not have lasted longer than 5 milliseconds.", 18, 0.08079719903043361, 0.024], "isController": false}, {"data": ["The operation lasted too long: It took 190 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 72 milliseconds, but should not have lasted longer than 5 milliseconds.", 8, 0.035909866235748274, 0.010666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 199 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 73 milliseconds, but should not have lasted longer than 5 milliseconds.", 14, 0.06284226591255948, 0.018666666666666668], "isController": false}, {"data": ["The operation lasted too long: It took 79 milliseconds, but should not have lasted longer than 5 milliseconds.", 7, 0.03142113295627974, 0.009333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 117 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 119 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.017954933117874137, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 75 milliseconds, but should not have lasted longer than 5 milliseconds.", 10, 0.04488733279468534, 0.013333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 77 milliseconds, but should not have lasted longer than 5 milliseconds.", 8, 0.035909866235748274, 0.010666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 61 milliseconds, but should not have lasted longer than 5 milliseconds.", 23, 0.10324086542777629, 0.030666666666666665], "isController": false}, {"data": ["The operation lasted too long: It took 29 milliseconds, but should not have lasted longer than 5 milliseconds.", 435, 1.9525989765688123, 0.58], "isController": false}, {"data": ["The operation lasted too long: It took 189 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 187 milliseconds, but should not have lasted longer than 5 milliseconds.", 3, 0.013466199838405602, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 27 milliseconds, but should not have lasted longer than 5 milliseconds.", 520, 2.3341413053236377, 0.6933333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 56 milliseconds, but should not have lasted longer than 5 milliseconds.", 37, 0.16608313134033575, 0.04933333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 58 milliseconds, but should not have lasted longer than 5 milliseconds.", 17, 0.07630846575096507, 0.02266666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 52 milliseconds, but should not have lasted longer than 5 milliseconds.", 47, 0.2109704641350211, 0.06266666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 113 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 54 milliseconds, but should not have lasted longer than 5 milliseconds.", 37, 0.16608313134033575, 0.04933333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 50 milliseconds, but should not have lasted longer than 5 milliseconds.", 52, 0.23341413053236376, 0.06933333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 21 milliseconds, but should not have lasted longer than 5 milliseconds.", 712, 3.195978094981596, 0.9493333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 390 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 23 milliseconds, but should not have lasted longer than 5 milliseconds.", 726, 3.2588203608941555, 0.968], "isController": false}, {"data": ["The operation lasted too long: It took 25 milliseconds, but should not have lasted longer than 5 milliseconds.", 554, 2.4867582368255676, 0.7386666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 215 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 97 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.017954933117874137, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 106 milliseconds, but should not have lasted longer than 5 milliseconds.", 3, 0.013466199838405602, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 108 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 99 milliseconds, but should not have lasted longer than 5 milliseconds.", 3, 0.013466199838405602, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 34 milliseconds, but should not have lasted longer than 5 milliseconds.", 280, 1.2568453182511896, 0.37333333333333335], "isController": false}, {"data": ["The operation lasted too long: It took 36 milliseconds, but should not have lasted longer than 5 milliseconds.", 227, 1.0189424544393573, 0.30266666666666664], "isController": false}, {"data": ["The operation lasted too long: It took 102 milliseconds, but should not have lasted longer than 5 milliseconds.", 3, 0.013466199838405602, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 104 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.008977466558937068, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 100 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.017954933117874137, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 30 milliseconds, but should not have lasted longer than 5 milliseconds.", 419, 1.8807792440973157, 0.5586666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 224 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 32 milliseconds, but should not have lasted longer than 5 milliseconds.", 356, 1.597989047490798, 0.4746666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 38 milliseconds, but should not have lasted longer than 5 milliseconds.", 181, 0.8124607235838046, 0.24133333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 163 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004488733279468534, 0.0013333333333333333], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 75000, 22278, "The operation lasted too long: It took 9 milliseconds, but should not have lasted longer than 5 milliseconds.", 986, "The operation lasted too long: It took 11 milliseconds, but should not have lasted longer than 5 milliseconds.", 894, "The operation lasted too long: It took 13 milliseconds, but should not have lasted longer than 5 milliseconds.", 885, "The operation lasted too long: It took 14 milliseconds, but should not have lasted longer than 5 milliseconds.", 885, "The operation lasted too long: It took 8 milliseconds, but should not have lasted longer than 5 milliseconds.", 885], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["HTTP Request", 25000, 22278, "The operation lasted too long: It took 9 milliseconds, but should not have lasted longer than 5 milliseconds.", 986, "The operation lasted too long: It took 11 milliseconds, but should not have lasted longer than 5 milliseconds.", 894, "The operation lasted too long: It took 13 milliseconds, but should not have lasted longer than 5 milliseconds.", 885, "The operation lasted too long: It took 14 milliseconds, but should not have lasted longer than 5 milliseconds.", 885, "The operation lasted too long: It took 8 milliseconds, but should not have lasted longer than 5 milliseconds.", 885], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
