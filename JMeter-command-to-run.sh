sudo $(Agent.HomeDirectory)/../../opt/apache-jmeter-5.3/bin/jmeter -n -f -t ./loadtest/Petclinic_loadtest.jmx -l ./loadtest/test_log/petclinic-test-result.jtl -e -o ./loadtest/dashboard
