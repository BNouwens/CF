
Write-Output "#####################################################################################"
Write-Output " Installing Java 1.8.0_144"

try {
    mkdir c:\temp -ErrorAction stop
}
catch {
    Write-Output " Directory not created - likely already exists"
}

#Download Installer
Write-Output " Downloading JRE from media bucket"
wget https://s3-ap-southeast-2.amazonaws.com/p2pmedia/jre-8u144-windows-x64.exe -OutFile c:\temp\jre-8u144-windows-x64.exe

$filepath = "C:\Program Files\Java\jre1.8.0_144\bin\java.exe"

$filetest = Test-Path $filepath

if ($filetest -eq $false) {
    Write-Output "Java Verison 1.8.0_144 Not Found"
    Try {
        net stop Tomcat8
        Remove-Item "C:\Program Files\Java\jre1.8.0*" -recurse -ErrorAction stop
    }
    catch {
        Write-Output "Folder could not be removed"
    }
    try {
        Write-Output "Installed JRE 1.8.0_144"
        cd c:\temp
        .\jre-8u144-windows-x64.exe /s REMOVEOUTOFDATEJRES=1
        Start-Sleep -s 15
        net start Tomcat8
    }
    catch {
        Write-Output "Install failed"
    }
}
if ($filetest -eq $true) {
    Write-Output "Java installation not required"
}

$filetest = Test-Path $filepath

if ($filetest -eq $false) {
    Write-Output "Java not found after script executed"
}


