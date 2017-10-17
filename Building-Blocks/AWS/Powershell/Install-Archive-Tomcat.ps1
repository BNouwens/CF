Write-Output "#####################################################################################"
Write-Output "  Running process to install Tomcat 8.5.20"

function installTomcat ($installpath) {

    #Download Installer
    Write-Output " Downloading Tomcat from media bucket"
    wget https://s3-ap-southeast-2.amazonaws.com/p2pmedia/apache-tomcat-8.5.20.exe -OutFile c:\temp\apache-tomcat-8.5.20.exe

    #Install Tomcat
    Set-Location c:\temp
    Write-Output " Installing Tomcat - command .\apache-tomcat-8.5.20.exe /S /D=$installpath! "
    .\apache-tomcat-8.5.20.exe /S /D=D:\Apache Software Foundation\Tomcat 8.5
    #.\apache-tomcat-8.5.20.exe /S /D=$installpath

    #Pause
    Start-Sleep -s 15

    #Set Java Options
    Push-Location "$installpath\bin"
    .\tomcat8 //US//Tomcat8 --JvmMs=512 --JvmMx=1024 --Startup=auto

    #Configure Context
    $contextContent = @("<?xml version='1.0' encoding='utf-8'?>
<!--`r
  Licensed to the Apache Software Foundation (ASF) under one or more`r
  contributor license agreements.  See the NOTICE file distributed with`r
  this work for additional information regarding copyright ownership.`r
  The ASF licenses this file to You under the Apache License, Version 2.0`r
  (the `"License`"); you may not use this file except in compliance with`r
  the License.  You may obtain a copy of the License at`r
`r
      http://www.apache.org/licenses/LICENSE-2.0`r
`r
  Unless required by applicable law or agreed to in writing, software`r
  distributed under the License is distributed on an `"AS IS`" BASIS,`r
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.`r
  See the License for the specific language governing permissions and`r
  limitations under the License.`r
-->`r
<!-- The contents of this file will be loaded for each web application -->`r
<Context>`r
`r
    <!-- Default set of monitored resources. If one of these changes, the    -->`r
    <!-- web application will be reloaded.                                   -->`r
    <WatchedResource>WEB-INF/web.xml</WatchedResource>`r
    <WatchedResource>`${catalina.base}/conf/web.xml</WatchedResource>`r
	<CookieProcessor className=`"org.apache.tomcat.util.http.LegacyCookieProcessor`" />`r
	`r
    <!-- Uncomment this to disable session persistence across Tomcat restarts -->`r
    <!--`r
    <Manager pathname="" />`r
    -->`r
`r
    <!-- Uncomment this to enable Comet connection tacking (provides events`r
         on session expiration as well as webapp lifecycle) -->`r
    <!--`r
    <Valve className=`"org.apache.catalina.valves.CometConnectionManagerValve`" />`r
    -->`r
</Context>`r
")

    #New-Item "D:\Apache Software Foundation\Tomcat 8.0\conf\context.xml" -type file -force -value $contextContent
    $contextContent | New-Item "$installpath\conf\context.xml" -type file -force


    #Configure Logging.properties
    $loggingContent = @("
# Licensed to the Apache Software Foundation (ASF) under one or more`r
# contributor license agreements.  See the NOTICE file distributed with`r
# this work for additional information regarding copyright ownership.`r
# The ASF licenses this file to You under the Apache License, Version 2.0`r
# (the `"License`"); you may not use this file except in compliance with`r
# the License.  You may obtain a copy of the License at`r
#`r
#     http://www.apache.org/licenses/LICENSE-2.0`r
#`r
# Unless required by applicable law or agreed to in writing, software`r
# distributed under the License is distributed on an `"AS IS`" BASIS,`r
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.`r
# See the License for the specific language governing permissions and`r
# limitations under the License.`r
`r
handlers = 1catalina.org.apache.juli.AsyncFileHandler, 2localhost.org.apache.juli.AsyncFileHandler, 3manager.org.apache.juli.AsyncFileHandler, 4host-manager.org.apache.juli.AsyncFileHandler, java.util.logging.ConsoleHandler`r
`r
.handlers = 1catalina.org.apache.juli.AsyncFileHandler`r
`r
############################################################`r
# Handler specific properties.`r
# Describes specific configuration info for Handlers.`r
############################################################`r
`r
1catalina.org.apache.juli.AsyncFileHandler.level = FINE`r
1catalina.org.apache.juli.AsyncFileHandler.directory = `${catalina.base}/logs`r
1catalina.org.apache.juli.AsyncFileHandler.prefix = catalina.`r
`r
2localhost.org.apache.juli.AsyncFileHandler.level = FINE`r
2localhost.org.apache.juli.AsyncFileHandler.directory = `${catalina.base}/logs`r
2localhost.org.apache.juli.AsyncFileHandler.prefix = localhost.`r
`r
3manager.org.apache.juli.AsyncFileHandler.level = FINE`r
3manager.org.apache.juli.AsyncFileHandler.directory = `${catalina.base}/logs`r
3manager.org.apache.juli.AsyncFileHandler.prefix = manager.`r
`r
4host-manager.org.apache.juli.AsyncFileHandler.level = FINE`r
4host-manager.org.apache.juli.AsyncFileHandler.directory = `${catalina.base}/logs`r
4host-manager.org.apache.juli.AsyncFileHandler.prefix = host-manager.`r
`r
java.util.logging.ConsoleHandler.level = FINE`r
java.util.logging.ConsoleHandler.formatter = org.apache.juli.OneLineFormatter`r
`r
`r
############################################################`r
# Facility specific properties.`r
# Provides extra control for each logger.`r
############################################################`r
`r
org.apache.catalina.core.ContainerBase.[Catalina].[localhost].level = INFO`r
org.apache.catalina.core.ContainerBase.[Catalina].[localhost].handlers = 2localhost.org.apache.juli.AsyncFileHandler`r
`r
org.apache.catalina.core.ContainerBase.[Catalina].[localhost].[/manager].level = INFO`r
org.apache.catalina.core.ContainerBase.[Catalina].[localhost].[/manager].handlers = 3manager.org.apache.juli.AsyncFileHandler`r
`r
org.apache.catalina.core.ContainerBase.[Catalina].[localhost].[/host-manager].level = INFO`r
org.apache.catalina.core.ContainerBase.[Catalina].[localhost].[/host-manager].handlers = 4host-manager.org.apache.juli.AsyncFileHandler`r
`r
# For example, set the org.apache.catalina.util.LifecycleBase logger to log`r
# each component that extends LifecycleBase changing state:`r
#org.apache.catalina.util.LifecycleBase.level = FINE`r
`r
# To see debug messages in TldLocationsCache, uncomment the following line:`r
#org.apache.jasper.compiler.TldLocationsCache.level = FINE`r
`r
")

    #New-Item "D:\Apache Software Foundation\Tomcat 8.0\conf\logging.properties" -type file -force -value $loggingContent
    $loggingContent | New-Item "$installpath\conf\logging.properties" -type file -force


    #Configure Environment Variables
    [Environment]::SetEnvironmentVariable("AS_PREF_IP", "4", "Machine")

    Write-Output " Starting Tomcat"
    net start tomcat8

    #Configure Local Windows Firewall
    $findFWRule = Get-NetFirewallRule -DisplayName "Apache Web-In*"
    $int = 0
    foreach ($record in $findFWRule) {$int++}

    if ($int -lt 1) {
        echo "No Rule Found"
        netsh advfirewall firewall add rule name="Apache Web-In" dir=in localport=8080 protocol=TCP action=allow
        netsh advfirewall firewall add rule name="HazelCase-Out" dir=out localport=5701 protocol=TCP action=allow
        netsh advfirewall firewall add rule name="HazelCase-In" dir=in localport=5701 protocol=TCP action=allow

    }
}

try {
    mkdir c:\temp -ErrorAction stop
}
catch {
    Write-Output " Directory not created - likely already exists"
}

$installpath = "D:\Apache Software Foundation\Tomcat 8.5"
$filepath = "$installpath\bin\tomcat8.exe"
$filetest = Test-Path $filepath



if ($filetest -eq $false) {
    Write-Output "Tomcat 8.5 Not Found"
    
    Try {
        $foundservices = Get-Service "Tomcat*"
        if ($foundservices.Count -gt 0) {
            Stop-Service Tomcat8 -ErrorAction SilentlyContinue
            Push-Location D: -ErrorAction SilentlyContinue
        
            $findtomcat8 = Get-ChildItem -Recurse -filter "tomcat8.exe" -File -ErrorAction SilentlyContinue
        
            $tomcatlocation = $findtomcat8.DirectoryName

            Push-Location $tomcatlocation
            cd ..

            .\uninstall.exe /S -ServiceName="Tomcat8"

            #Pause
            Start-Sleep -s 10
        }

        
    }
    catch {
        Write-Output "Something Happened Uninstalling previous"
    }
    #Run Install Module
    installTomcat ($installpath)
}

if ($filetest -eq $true) {
    Write-Output "Tomcat installation not required"
}

