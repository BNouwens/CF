#In Powershell

Push-location "c:\Program Files\Trend Micro\Deep Security Agent"
.\dsa_control -r
Stop-Service ds_agent

#May want to disable service so on restart it is not re-enabled



