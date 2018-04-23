Configuration DiskConfig
{
    param ($MachineName)

    Import-DscResource -ModuleName xStorage, xPendingReboot, PSDesiredStateConfiguration 

    Node $MachineName
    {
        xWaitforDisk Disk2
        {
            DiskNumber = 2
            RetryIntervalSec = 1
            RetryCount = 1
        }

        xDisk FDisk 
        {
            DiskNumber = 2
            DriveLetter = "F"
            DependsOn = "[xWaitForDisk]Disk2"
        }

        xWaitforDisk Disk3
        {
            DiskNumber = 3
            RetryIntervalSec = 1
            RetryCount = 1
        }

        xDisk GDisk {
            DiskNumber = 3
            DriveLetter = "G"
            DependsOn = "[xWaitForDisk]Disk3"
        }
        xWaitforDisk Disk4
        {
            DiskNumber = 4
            RetryIntervalSec = 1
            RetryCount = 1
        }

        xDisk HDisk {
            DiskNumber = 4
            DriveLetter = "H"
            DependsOn = "[xWaitForDisk]Disk4"
        }
        xWaitforDisk Disk5
        {
            DiskNumber = 5
            RetryIntervalSec = 1
            RetryCount = 1
        }

        xDisk IDisk {
            DiskNumber = 5
            DriveLetter = "I"
            DependsOn = "[xWaitForDisk]Disk5"
        }

        User BryanNouwens {
            Username = "Bryan.Nouwens"
            PasswordNeverExpires = $true
            Password = "P@ssword1"
        }
      
      
      
    }
} 
