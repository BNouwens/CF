Configuration IISConfig
{
    param ($MachineName)

    Import-DscResource -ModuleName xStorage, xPendingReboot, PSDesiredStateConfiguration 

    Node $MachineName
    {
      
      
        ###Loops through each drive letter and attaches it
        #ForEach ($item in $Node.StandAloneDisks) {

        #    xWaitforDisk "WaitforDisk_$($Node.StandAloneDisks.Indexof($item))" {
        #        DiskID           = $item.WaitDiskNumber
        #        RetryIntervalSec = $item.RetryInterval
        #        RetryCount       = $item.RetryCount
        #    }
    
        #    xDisk "Disk_$($Node.StandAloneDisks.Indexof($item))" {
        #        DiskID             = $item.disknumber
        #        Driveletter        = $item.driveletter
        #        FSLabel            = $item.fslabel
        #        AllocationUnitSize = 64kb
        #    }
        #}
      
        #xWaitforDisk Disk2
        #  {
        #      DiskNumber = 2
        #      RetryIntervalSec = 20
        #      RetryCount = 30
        #  }

        #  xDisk ADDataDisk {
        #      DiskNumber = 2
        #      DriveLetter = "F"
        #      DependsOn = "[xWaitForDisk]Disk2"
        #  }

        #Install ASP.NET 3 and 4.5
        WindowsFeature NETFrameworkCore {
            Name   = "NET-Framework-Core"
            Ensure = "Present"
            
        }

        WindowsFeature ASP35 {
            Ensure = "Present"
            Name   = "Web-Asp-Net"
        }

        WindowsFeature NetFrameworkFeatures  {
            Name   = "NET-Framework-Features"
            Ensure = "Present"
        }

      
      
        #Install the IIS Role
        WindowsFeature IIS {
            Ensure = "Present"
            Name   = "Web-Server"
        }

        WindowsFeature WebRequestMonitor {
            Ensure = "Present"
            Name   = "Web-Request-Monitor"
        }

        WindowsFeature WebDynCompression {
            Ensure = "Present"
            Name   = "Web-Dyn-Compression"
        }

        WindowsFeature ASP {
            Ensure = "Present"
            Name   = "Web-Asp-Net45"
        }
        
        WindowsFeature CGI {
            Ensure = "Present"
            Name   = "Web-CGI"
        }

        WindowsFeature WebServerManagementConsole {
            Name   = "Web-Mgmt-Console"
            Ensure = "Present"
        }

        WindowsFeature WebServerManagementConsoleCompat {
            Name   = "Web-Mgmt-Compat"
            Ensure = "Present"
        }

        WindowsFeature  NETHTTPActivation {
            Name   = "NET-HTTP-Activation"
            Ensure = "Present"
        }

        WindowsFeature NETNonHTTPActiv  {
            Name   = "NET-Non-HTTP-Activ"
            Ensure = "Present"
        }

        WindowsFeature NETWCFHTTPActivation45 {
            Name   = "NET-WCF-HTTP-Activation45"
            Ensure = "Present"
        }

        WindowsFeature NETWCFTCPActivation45 {
            Name   = "NET-WCF-TCP-Activation45"
            Ensure = "Present"
        }

        WindowsFeature WebNetExt {
            Name   = "Web-Net-Ext"
            Ensure = "Present"
        }

        WindowsFeature WAS {
            Name   = "WAS"
            Ensure = "Present"
        }

        WindowsFeature WASProcessModel {
            Name   = "WAS-Process-Model"
            Ensure = "Present"
        }

        WindowsFeature WASNETEnvironment {
            Name   = "WAS-NET-Environment"
            Ensure = "Present"
        }
        WindowsFeature WASConfigAPIs {
            Name   = "WAS-Config-APIs"
            Ensure = "Present"
        }
       
    }
} 
