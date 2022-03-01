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

    var data = {"OkPercent": 71.072, "KoPercent": 28.928};
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
    createTable($("#apdexTable"), {"supportsControllersDiscrimination": true, "overall": {"data": [0.71072, 500, 1500, "Total"], "isController": false}, "titles": ["Apdex", "T (Toleration threshold)", "F (Frustration threshold)", "Label"], "items": [{"data": [1.0, 500, 1500, "HTTP Request-1"], "isController": false}, {"data": [1.0, 500, 1500, "HTTP Request-0"], "isController": false}, {"data": [0.13216, 500, 1500, "HTTP Request"], "isController": false}]}, function(index, item){
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
    createTable($("#statisticsTable"), {"supportsControllersDiscrimination": true, "overall": {"data": ["Total", 75000, 21696, 28.928, 13.97998666666673, 0, 325, 7.0, 20.0, 27.0, 78.0, 3403.8304438594896, 8652.244471612055, 560.6569676409187], "isController": false}, "titles": ["Label", "#Samples", "KO", "Error %", "Average", "Min", "Max", "Median", "90th pct", "95th pct", "99th pct", "Transactions\/s", "Received", "Sent"], "items": [{"data": ["HTTP Request-1", 25000, 0, 0.0, 9.445400000000008, 0, 250, 8.0, 19.0, 25.0, 54.0, 1137.7599781550084, 4215.911822179493, 141.10890354070906], "isController": false}, {"data": ["HTTP Request-0", 25000, 0, 0.0, 11.139120000000055, 0, 242, 8.0, 25.0, 33.0, 64.0, 1134.7131445170662, 121.8930135711692, 139.62290645424838], "isController": false}, {"data": ["HTTP Request", 25000, 21696, 86.784, 21.355440000000037, 0, 325, 19.0, 44.0, 55.0, 93.0, 1134.6101479531635, 4326.122235806028, 280.3284838204593], "isController": false}]}, function(index, item){
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
    createTable($("#errorsTable"), {"supportsControllersDiscrimination": false, "titles": ["Type of error", "Number of errors", "% in errors", "% in all samples"], "items": [{"data": ["The operation lasted too long: It took 78 milliseconds, but should not have lasted longer than 5 milliseconds.", 11, 0.050700589970501475, 0.014666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 118 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 149 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 16 milliseconds, but should not have lasted longer than 5 milliseconds.", 773, 3.5628687315634218, 1.0306666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 145 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.018436578171091445, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 74 milliseconds, but should not have lasted longer than 5 milliseconds.", 17, 0.07835545722713864, 0.02266666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 12 milliseconds, but should not have lasted longer than 5 milliseconds.", 827, 3.8117625368731565, 1.1026666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 43 milliseconds, but should not have lasted longer than 5 milliseconds.", 172, 0.7927728613569321, 0.22933333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 47 milliseconds, but should not have lasted longer than 5 milliseconds.", 125, 0.5761430678466076, 0.16666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 60 milliseconds, but should not have lasted longer than 5 milliseconds.", 33, 0.15210176991150443, 0.044], "isController": false}, {"data": ["The operation lasted too long: It took 6 milliseconds, but should not have lasted longer than 5 milliseconds.", 768, 3.5398230088495577, 1.024], "isController": false}, {"data": ["The operation lasted too long: It took 95 milliseconds, but should not have lasted longer than 5 milliseconds.", 9, 0.041482300884955754, 0.012], "isController": false}, {"data": ["The operation lasted too long: It took 91 milliseconds, but should not have lasted longer than 5 milliseconds.", 17, 0.07835545722713864, 0.02266666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 141 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 26 milliseconds, but should not have lasted longer than 5 milliseconds.", 450, 2.0741150442477876, 0.6], "isController": false}, {"data": ["The operation lasted too long: It took 57 milliseconds, but should not have lasted longer than 5 milliseconds.", 56, 0.2581120943952802, 0.07466666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 110 milliseconds, but should not have lasted longer than 5 milliseconds.", 7, 0.032264011799410026, 0.009333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 88 milliseconds, but should not have lasted longer than 5 milliseconds.", 7, 0.032264011799410026, 0.009333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 53 milliseconds, but should not have lasted longer than 5 milliseconds.", 56, 0.2581120943952802, 0.07466666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 114 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.018436578171091445, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 325 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 80 milliseconds, but should not have lasted longer than 5 milliseconds.", 20, 0.09218289085545722, 0.02666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 120 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 84 milliseconds, but should not have lasted longer than 5 milliseconds.", 6, 0.02765486725663717, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 182 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 81 milliseconds, but should not have lasted longer than 5 milliseconds.", 16, 0.07374631268436578, 0.021333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 124 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 125 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 244 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 64 milliseconds, but should not have lasted longer than 5 milliseconds.", 17, 0.07835545722713864, 0.02266666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 63 milliseconds, but should not have lasted longer than 5 milliseconds.", 25, 0.11522861356932153, 0.03333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 67 milliseconds, but should not have lasted longer than 5 milliseconds.", 23, 0.10601032448377581, 0.030666666666666665], "isController": false}, {"data": ["The operation lasted too long: It took 196 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 68 milliseconds, but should not have lasted longer than 5 milliseconds.", 29, 0.13366519174041297, 0.03866666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 129 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 128 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 135 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 138 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 71 milliseconds, but should not have lasted longer than 5 milliseconds.", 20, 0.09218289085545722, 0.02666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 70 milliseconds, but should not have lasted longer than 5 milliseconds.", 19, 0.08757374631268437, 0.025333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 197 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 48 milliseconds, but should not have lasted longer than 5 milliseconds.", 93, 0.4286504424778761, 0.124], "isController": false}, {"data": ["The operation lasted too long: It took 177 milliseconds, but should not have lasted longer than 5 milliseconds.", 3, 0.013827433628318585, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 19 milliseconds, but should not have lasted longer than 5 milliseconds.", 633, 2.917588495575221, 0.844], "isController": false}, {"data": ["The operation lasted too long: It took 17 milliseconds, but should not have lasted longer than 5 milliseconds.", 711, 3.2771017699115044, 0.948], "isController": false}, {"data": ["The operation lasted too long: It took 148 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 175 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 144 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 179 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 142 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 42 milliseconds, but should not have lasted longer than 5 milliseconds.", 172, 0.7927728613569321, 0.22933333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 13 milliseconds, but should not have lasted longer than 5 milliseconds.", 814, 3.7518436578171093, 1.0853333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 171 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 44 milliseconds, but should not have lasted longer than 5 milliseconds.", 159, 0.7328539823008849, 0.212], "isController": false}, {"data": ["The operation lasted too long: It took 90 milliseconds, but should not have lasted longer than 5 milliseconds.", 8, 0.03687315634218289, 0.010666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 173 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 15 milliseconds, but should not have lasted longer than 5 milliseconds.", 801, 3.691924778761062, 1.068], "isController": false}, {"data": ["The operation lasted too long: It took 46 milliseconds, but should not have lasted longer than 5 milliseconds.", 135, 0.6222345132743363, 0.18], "isController": false}, {"data": ["The operation lasted too long: It took 7 milliseconds, but should not have lasted longer than 5 milliseconds.", 779, 3.590523598820059, 1.0386666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 11 milliseconds, but should not have lasted longer than 5 milliseconds.", 804, 3.7057522123893807, 1.072], "isController": false}, {"data": ["The operation lasted too long: It took 9 milliseconds, but should not have lasted longer than 5 milliseconds.", 795, 3.664269911504425, 1.06], "isController": false}, {"data": ["The operation lasted too long: It took 94 milliseconds, but should not have lasted longer than 5 milliseconds.", 7, 0.032264011799410026, 0.009333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 92 milliseconds, but should not have lasted longer than 5 milliseconds.", 7, 0.032264011799410026, 0.009333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 140 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 85 milliseconds, but should not have lasted longer than 5 milliseconds.", 14, 0.06452802359882005, 0.018666666666666668], "isController": false}, {"data": ["The operation lasted too long: It took 87 milliseconds, but should not have lasted longer than 5 milliseconds.", 14, 0.06452802359882005, 0.018666666666666668], "isController": false}, {"data": ["The operation lasted too long: It took 89 milliseconds, but should not have lasted longer than 5 milliseconds.", 15, 0.06913716814159292, 0.02], "isController": false}, {"data": ["The operation lasted too long: It took 51 milliseconds, but should not have lasted longer than 5 milliseconds.", 64, 0.2949852507374631, 0.08533333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 22 milliseconds, but should not have lasted longer than 5 milliseconds.", 571, 2.6318215339233038, 0.7613333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 20 milliseconds, but should not have lasted longer than 5 milliseconds.", 604, 2.783923303834808, 0.8053333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 24 milliseconds, but should not have lasted longer than 5 milliseconds.", 508, 2.3414454277286136, 0.6773333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 155 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 153 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 107 milliseconds, but should not have lasted longer than 5 milliseconds.", 6, 0.02765486725663717, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 96 milliseconds, but should not have lasted longer than 5 milliseconds.", 6, 0.02765486725663717, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 109 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.018436578171091445, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 98 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 223 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 35 milliseconds, but should not have lasted longer than 5 milliseconds.", 290, 1.3366519174041298, 0.38666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 105 milliseconds, but should not have lasted longer than 5 milliseconds.", 5, 0.023045722713864306, 0.006666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 103 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.018436578171091445, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 37 milliseconds, but should not have lasted longer than 5 milliseconds.", 257, 1.1845501474926254, 0.3426666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 101 milliseconds, but should not have lasted longer than 5 milliseconds.", 5, 0.023045722713864306, 0.006666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 40 milliseconds, but should not have lasted longer than 5 milliseconds.", 195, 0.8987831858407079, 0.26], "isController": false}, {"data": ["The operation lasted too long: It took 225 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 33 milliseconds, but should not have lasted longer than 5 milliseconds.", 340, 1.567109144542773, 0.4533333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 31 milliseconds, but should not have lasted longer than 5 milliseconds.", 387, 1.7837389380530972, 0.516], "isController": false}, {"data": ["The operation lasted too long: It took 39 milliseconds, but should not have lasted longer than 5 milliseconds.", 221, 1.0186209439528024, 0.2946666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 160 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 162 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 18 milliseconds, but should not have lasted longer than 5 milliseconds.", 670, 3.0881268436578173, 0.8933333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 178 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 147 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 143 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 76 milliseconds, but should not have lasted longer than 5 milliseconds.", 16, 0.07374631268436578, 0.021333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 266 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 14 milliseconds, but should not have lasted longer than 5 milliseconds.", 805, 3.7103613569321534, 1.0733333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 41 milliseconds, but should not have lasted longer than 5 milliseconds.", 194, 0.8941740412979351, 0.25866666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 45 milliseconds, but should not have lasted longer than 5 milliseconds.", 133, 0.6130162241887905, 0.17733333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 62 milliseconds, but should not have lasted longer than 5 milliseconds.", 36, 0.16592920353982302, 0.048], "isController": false}, {"data": ["The operation lasted too long: It took 10 milliseconds, but should not have lasted longer than 5 milliseconds.", 781, 3.599741887905605, 1.0413333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 8 milliseconds, but should not have lasted longer than 5 milliseconds.", 812, 3.7426253687315634, 1.0826666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 49 milliseconds, but should not have lasted longer than 5 milliseconds.", 93, 0.4286504424778761, 0.124], "isController": false}, {"data": ["The operation lasted too long: It took 93 milliseconds, but should not have lasted longer than 5 milliseconds.", 8, 0.03687315634218289, 0.010666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 188 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 28 milliseconds, but should not have lasted longer than 5 milliseconds.", 426, 1.9634955752212389, 0.568], "isController": false}, {"data": ["The operation lasted too long: It took 86 milliseconds, but should not have lasted longer than 5 milliseconds.", 10, 0.04609144542772861, 0.013333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 112 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.018436578171091445, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 59 milliseconds, but should not have lasted longer than 5 milliseconds.", 40, 0.18436578171091444, 0.05333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 55 milliseconds, but should not have lasted longer than 5 milliseconds.", 60, 0.27654867256637167, 0.08], "isController": false}, {"data": ["The operation lasted too long: It took 116 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 200 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 83 milliseconds, but should not have lasted longer than 5 milliseconds.", 19, 0.08757374631268437, 0.025333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 82 milliseconds, but should not have lasted longer than 5 milliseconds.", 20, 0.09218289085545722, 0.02666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 69 milliseconds, but should not have lasted longer than 5 milliseconds.", 14, 0.06452802359882005, 0.018666666666666668], "isController": false}, {"data": ["The operation lasted too long: It took 127 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 126 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 123 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 122 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.018436578171091445, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 133 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 66 milliseconds, but should not have lasted longer than 5 milliseconds.", 15, 0.06913716814159292, 0.02], "isController": false}, {"data": ["The operation lasted too long: It took 132 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 195 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 65 milliseconds, but should not have lasted longer than 5 milliseconds.", 20, 0.09218289085545722, 0.02666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 137 milliseconds, but should not have lasted longer than 5 milliseconds.", 3, 0.013827433628318585, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 72 milliseconds, but should not have lasted longer than 5 milliseconds.", 23, 0.10601032448377581, 0.030666666666666665], "isController": false}, {"data": ["The operation lasted too long: It took 199 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 73 milliseconds, but should not have lasted longer than 5 milliseconds.", 18, 0.08296460176991151, 0.024], "isController": false}, {"data": ["The operation lasted too long: It took 259 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 256 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 251 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 79 milliseconds, but should not have lasted longer than 5 milliseconds.", 18, 0.08296460176991151, 0.024], "isController": false}, {"data": ["The operation lasted too long: It took 117 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 119 milliseconds, but should not have lasted longer than 5 milliseconds.", 3, 0.013827433628318585, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 75 milliseconds, but should not have lasted longer than 5 milliseconds.", 8, 0.03687315634218289, 0.010666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 77 milliseconds, but should not have lasted longer than 5 milliseconds.", 14, 0.06452802359882005, 0.018666666666666668], "isController": false}, {"data": ["The operation lasted too long: It took 61 milliseconds, but should not have lasted longer than 5 milliseconds.", 28, 0.1290560471976401, 0.037333333333333336], "isController": false}, {"data": ["The operation lasted too long: It took 29 milliseconds, but should not have lasted longer than 5 milliseconds.", 372, 1.7146017699115044, 0.496], "isController": false}, {"data": ["The operation lasted too long: It took 187 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 27 milliseconds, but should not have lasted longer than 5 milliseconds.", 428, 1.9727138643067847, 0.5706666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 56 milliseconds, but should not have lasted longer than 5 milliseconds.", 47, 0.2166297935103245, 0.06266666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 111 milliseconds, but should not have lasted longer than 5 milliseconds.", 5, 0.023045722713864306, 0.006666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 58 milliseconds, but should not have lasted longer than 5 milliseconds.", 48, 0.22123893805309736, 0.064], "isController": false}, {"data": ["The operation lasted too long: It took 52 milliseconds, but should not have lasted longer than 5 milliseconds.", 81, 0.3733407079646018, 0.108], "isController": false}, {"data": ["The operation lasted too long: It took 113 milliseconds, but should not have lasted longer than 5 milliseconds.", 5, 0.023045722713864306, 0.006666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 54 milliseconds, but should not have lasted longer than 5 milliseconds.", 64, 0.2949852507374631, 0.08533333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 115 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 50 milliseconds, but should not have lasted longer than 5 milliseconds.", 86, 0.3963864306784661, 0.11466666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 21 milliseconds, but should not have lasted longer than 5 milliseconds.", 609, 2.8069690265486726, 0.812], "isController": false}, {"data": ["The operation lasted too long: It took 23 milliseconds, but should not have lasted longer than 5 milliseconds.", 541, 2.493547197640118, 0.7213333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 25 milliseconds, but should not have lasted longer than 5 milliseconds.", 488, 2.2492625368731565, 0.6506666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 213 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 97 milliseconds, but should not have lasted longer than 5 milliseconds.", 8, 0.03687315634218289, 0.010666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 106 milliseconds, but should not have lasted longer than 5 milliseconds.", 9, 0.041482300884955754, 0.012], "isController": false}, {"data": ["The operation lasted too long: It took 108 milliseconds, but should not have lasted longer than 5 milliseconds.", 7, 0.032264011799410026, 0.009333333333333334], "isController": false}, {"data": ["The operation lasted too long: It took 99 milliseconds, but should not have lasted longer than 5 milliseconds.", 3, 0.013827433628318585, 0.004], "isController": false}, {"data": ["The operation lasted too long: It took 34 milliseconds, but should not have lasted longer than 5 milliseconds.", 323, 1.4887536873156342, 0.43066666666666664], "isController": false}, {"data": ["The operation lasted too long: It took 102 milliseconds, but should not have lasted longer than 5 milliseconds.", 4, 0.018436578171091445, 0.005333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 36 milliseconds, but should not have lasted longer than 5 milliseconds.", 269, 1.2398598820058997, 0.3586666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 104 milliseconds, but should not have lasted longer than 5 milliseconds.", 6, 0.02765486725663717, 0.008], "isController": false}, {"data": ["The operation lasted too long: It took 226 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 100 milliseconds, but should not have lasted longer than 5 milliseconds.", 5, 0.023045722713864306, 0.006666666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 30 milliseconds, but should not have lasted longer than 5 milliseconds.", 377, 1.7376474926253687, 0.5026666666666667], "isController": false}, {"data": ["The operation lasted too long: It took 224 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 219 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 32 milliseconds, but should not have lasted longer than 5 milliseconds.", 358, 1.6500737463126844, 0.47733333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 169 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 38 milliseconds, but should not have lasted longer than 5 milliseconds.", 241, 1.1108038348082596, 0.32133333333333336], "isController": false}, {"data": ["The operation lasted too long: It took 161 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}, {"data": ["The operation lasted too long: It took 167 milliseconds, but should not have lasted longer than 5 milliseconds.", 1, 0.004609144542772861, 0.0013333333333333333], "isController": false}, {"data": ["The operation lasted too long: It took 165 milliseconds, but should not have lasted longer than 5 milliseconds.", 2, 0.009218289085545723, 0.0026666666666666666], "isController": false}]}, function(index, item){
        switch(index){
            case 2:
            case 3:
                item = item.toFixed(2) + '%';
                break;
        }
        return item;
    }, [[1, 1]]);

        // Create top5 errors by sampler
    createTable($("#top5ErrorsBySamplerTable"), {"supportsControllersDiscrimination": false, "overall": {"data": ["Total", 75000, 21696, "The operation lasted too long: It took 12 milliseconds, but should not have lasted longer than 5 milliseconds.", 827, "The operation lasted too long: It took 13 milliseconds, but should not have lasted longer than 5 milliseconds.", 814, "The operation lasted too long: It took 8 milliseconds, but should not have lasted longer than 5 milliseconds.", 812, "The operation lasted too long: It took 14 milliseconds, but should not have lasted longer than 5 milliseconds.", 805, "The operation lasted too long: It took 11 milliseconds, but should not have lasted longer than 5 milliseconds.", 804], "isController": false}, "titles": ["Sample", "#Samples", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors", "Error", "#Errors"], "items": [{"data": [], "isController": false}, {"data": [], "isController": false}, {"data": ["HTTP Request", 25000, 21696, "The operation lasted too long: It took 12 milliseconds, but should not have lasted longer than 5 milliseconds.", 827, "The operation lasted too long: It took 13 milliseconds, but should not have lasted longer than 5 milliseconds.", 814, "The operation lasted too long: It took 8 milliseconds, but should not have lasted longer than 5 milliseconds.", 812, "The operation lasted too long: It took 14 milliseconds, but should not have lasted longer than 5 milliseconds.", 805, "The operation lasted too long: It took 11 milliseconds, but should not have lasted longer than 5 milliseconds.", 804], "isController": false}]}, function(index, item){
        return item;
    }, [[0, 0]], 0);

});
