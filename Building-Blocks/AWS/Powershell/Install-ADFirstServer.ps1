

Install-ADDSForest -CreateDnsDelegation:$true -DatabasePath “C:\Windows\NTDS” -DomainMode “Win2012R2” -DomainName “bntest.local” -DomainNetbiosName “bntest” -ForestMode “Win2012R2” -InstallDns:$true -LogPath “C:\Windows\NTDS” -NoRebootOnCompletion:$false -SysvolPath “C:\Windows\SYSVOL” -Force:$true 
