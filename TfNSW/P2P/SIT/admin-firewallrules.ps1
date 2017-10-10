 $findFWRule = Get-NetFirewallRule -DisplayName "ContentAdmin*"
    $int = 0
    foreach ($record in $findFWRule) {$int++}

    if ($int -lt 1) {
        echo " Creating Firewall Rule"
        netsh advfirewall firewall add rule name="ContentAdmin" dir=in localport=8500-8515 protocol=TCP action=allow
    }


    