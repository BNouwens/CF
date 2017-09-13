Write-Output "#####################################################################################"
Write-Output " Installing Tomcat 8.0.46"

function installTomcat ($installpath) {

    #Download Installer
    Write-Output " Downloading Tomcat from media bucket"
    wget https://s3-ap-southeast-2.amazonaws.com/p2pmedia/apache-tomcat-8.0.46.exe -OutFile c:\temp\apache-tomcat-8.0.46.exe

    #Install Tomcat
    Set-Location c:\temp
    Write-Output " Installing Tomcat"
    .\apache-tomcat-8.0.46.exe /S /D=D:\Apache Software Foundation\Tomcat 8.0

    #Pause
    Start-Sleep -s 15

    #In case Tomcat is running - stop it
    Write-Output " Stopping Tomcat"
    Stop-Service Tomcat8 -ErrorAction SilentlyContinue

    #Set Java Options
    Push-Location "$installpath\bin"
    .\tomcat8 //US//Tomcat8 --JvmMs=256 --JvmMx=1024 --Startup=auto

    #Configure Server.xml

    #Configure Server.xml
    $serverContent = @("<?xml version='1.0' encoding='utf-8'?>`r
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
<!-- Note:  A `"Server`" is not itself a `"Container`", so you may not`r
     define subcomponents such as `"Valves`" at this level.`r
     Documentation at /docs/config/server.html`r
 -->`r
<Server port=`"8005`" shutdown=`"SHUTDOWN`">`r
  <Listener className=`"org.apache.catalina.startup.VersionLoggerListener`" />`r
  <!-- Security listener. Documentation at /docs/config/listeners.html`r
  <Listener className=`"org.apache.catalina.security.SecurityListener`" />`r
  -->`r
  <!--APR library loader. Documentation at /docs/apr.html -->`r
  <Listener className=`"org.apache.catalina.core.AprLifecycleListener`" SSLEngine=`"on`" />`r
  <!-- Prevent memory leaks due to use of particular java/javax APIs-->`r
  <Listener className=`"org.apache.catalina.core.JreMemoryLeakPreventionListener`" />`r
  <Listener className=`"org.apache.catalina.mbeans.GlobalResourcesLifecycleListener`" />`r
  <Listener className=`"org.apache.catalina.core.ThreadLocalLeakPreventionListener`" />`r
`r
  <!-- Global JNDI resources`r
       Documentation at /docs/jndi-resources-howto.html`r
  -->`r
  <GlobalNamingResources>`r
    <!-- Editable user database that can also be used by`r
         UserDatabaseRealm to authenticate users`r
    -->`r
    <Resource name=`"UserDatabase`" auth=`"Container`"`r
              type=`"org.apache.catalina.UserDatabase`"`r
              description=`"User database that can be updated and saved`"`r
              factory=`"org.apache.catalina.users.MemoryUserDatabaseFactory`"`r
              pathname=`"conf/tomcat-users.xml`" />`r
  </GlobalNamingResources>`r
`r
  <!-- A `"Service`" is a collection of one or more `"Connectors`" that share`r
       a single `"Container`" Note:  A `"Service`" is not itself a `"Container`",`r
       so you may not define subcomponents such as `"Valves`" at this level.`r
       Documentation at /docs/config/service.html`r
   -->`r
  <Service name=`"Catalina`">`r
`r
    <!--The connectors can use a shared executor, you can define one or more named thread pools-->`r
    <!--`r
    <Executor name=`"tomcatThreadPool`" namePrefix=`"catalina-exec-`"`r
        maxThreads=`"150`" minSpareThreads=`"4`"/>`r
    -->`r
`r
`r
    <!-- A `"Connector`" represents an endpoint by which requests are received`r
         and responses are returned. Documentation at :`r
         Java HTTP Connector: /docs/config/http.html (blocking & non-blocking)`r
         Java AJP  Connector: /docs/config/ajp.html`r
         APR (HTTP/AJP) Connector: /docs/apr.html`r
         Define a non-SSL/TLS HTTP/1.1 Connector on port 8080`r
    -->`r
    <Connector port=`"8080`" protocol=`"HTTP/1.1`"`r
               connectionTimeout=`"20000`"`r
               redirectPort=`"8443`"`r
               maxHttpHeaderSize=`"65536`" />`r
    <!-- A `"Connector`" using the shared thread pool-->`r
    <!--`r
    <Connector executor=`"tomcatThreadPool`"`r
               port=`"8080`" protocol=`"HTTP/1.1`"`r
               connectionTimeout=`"20000`"`r
               redirectPort=`"8443`" />`r
    -->`r
    <!-- Define a SSL/TLS HTTP/1.1 Connector on port 8443`r
         This connector uses the NIO implementation that requires the JSSE`r
         style configuration. When using the APR/native implementation, the`r
         OpenSSL style configuration is required as described in the APR/native`r
         documentation -->`r
    <!--`r
    <Connector port=`"8443`" protocol=`"org.apache.coyote.http11.Http11NioProtocol`"`r
               maxThreads=`"150`" SSLEnabled=`"true`" scheme=`"https`" secure=`"true`"`r
               clientAuth=`"false`" sslProtocol=`"TLS`" />`r
    -->`r
`r
    <!-- Define an AJP 1.3 Connector on port 8009 -->`r
    <Connector port=`"8009`" protocol=`"AJP/1.3`" redirectPort=`"8443`" />`r
`r
`r
    <!-- An Engine represents the entry point (within Catalina) that processes`r
         every request.  The Engine implementation for Tomcat stand alone`r
         analyzes the HTTP headers included with the request, and passes them`r
         on to the appropriate Host (virtual host).`r
         Documentation at /docs/config/engine.html -->`r
`r
    <!-- You should set jvmRoute to support load-balancing via AJP ie :`r
    <Engine name=`"Catalina`" defaultHost=`"localhost`" jvmRoute=`"jvm1`">`r
    -->`r
    <Engine name=`"Catalina`" defaultHost=`"localhost`">`r
`r
      <!--For clustering, please take a look at documentation at:`r
          /docs/cluster-howto.html  (simple how to)`r
          /docs/config/cluster.html (reference documentation) -->`r
      <!--`r
      <Cluster className=`"org.apache.catalina.ha.tcp.SimpleTcpCluster`"/>`r
      -->`r
`r
      <!-- Use the LockOutRealm to prevent attempts to guess user passwords`r
           via a brute-force attack -->`r
      <Realm className=`"org.apache.catalina.realm.LockOutRealm`">`r
        <!-- This Realm uses the UserDatabase configured in the global JNDI`r
             resources under the key `"UserDatabase`".  Any edits`r
             that are performed against this UserDatabase are immediately`r
             available for use by the Realm.  -->`r
        <Realm className=`"org.apache.catalina.realm.UserDatabaseRealm`"`r
               resourceName=`"UserDatabase`"/>`r
      </Realm>`r
`r
      <Host name=`"localhost`"  appBase=`"webapps`"`r
            unpackWARs=`"true`" autoDeploy=`"true`">`r
`r
        <!-- SingleSignOn valve, share authentication between web applications`r
             Documentation at: /docs/config/valve.html -->`r
        <!--`r
        <Valve className=`"org.apache.catalina.authenticator.SingleSignOn`" />`r
        -->`r
`r
        <!-- Access log processes all example.`r
             Documentation at: /docs/config/valve.html`r
             Note: The pattern used is equivalent to using pattern=`"common`" -->`r
        <Valve className=`"org.apache.catalina.valves.AccessLogValve`" directory=`"logs`"`r
               prefix=`"localhost_access_log`" suffix=`".txt`"`r
               pattern=`"%h %l %u %t &quot;%r&quot; %s %b`" />`r
`r
      </Host>`r
    </Engine>`r
  </Service>`r
</Server>`r
`r
")

    #New-Item "D:\Apache Software Foundation\Tomcat 8.0\conf\context.xml" -type file -force -value $contextContent
    $serverContent | New-Item "D:\Apache Software Foundation\Tomcat 8.0\conf\server.xml" -type file -force

    Write-Output " Starting Tomcat"
    net start tomcat8

    #Configure Local Windows Firewall
    $findFWRule = Get-NetFirewallRule -DisplayName "Apache Web-In*"
    $int = 0
    foreach ($record in $findFWRule) {$int++}

    if ($int -lt 1) {
        echo " Creating Firewall Rule"
        netsh advfirewall firewall add rule name="Apache Web-In" dir=in localport=8080 protocol=TCP action=allow
    }
}


try {
    mkdir c:\temp -ErrorAction stop
}
catch {
    Write-Output " Directory not created - likely already exists"
}

$installpath = "D:\Apache Software Foundation\Tomcat 8.0"
$filepath = "$installpath\bin\tomcat8.exe"
$filetest = Test-Path $filepath

if ($filetest -eq $false) {
    Write-Output "Tomcat 8.0 Not Found"
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

