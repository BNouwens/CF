####################################################################
#  #
# Author: Christopher Cardenas  #
# Creation Date: 9/5/2015  #
# Last Modified: 06/23/2015  #
#  #
#  *Modified for release to TechNet Wiki Articles.  #
#  #
#  #
#  #
#  #
####################################################################
#######################################################################################################################################
# The following section was taken from http://blogs.msdn.com/b/virtual_pc_guy/archive/2010/09/23/a-self-elevating- Jump #powershell-script.aspx
# This section is used to ensure we are running the script "As Administrator" so we don't get access denied errors when we #run
# commands that require administrator permissions.
# Get the ID and security principal of the current user account
$myWindowsID=[System.Security.Principal.WindowsIdentity]::GetCurrent()
$myWindowsPrincipal=new-object System.Security.Principal.WindowsPrincipal($myWindowsID)
# Get the security principal for the Administrator role
$adminRole=[System.Security.Principal.WindowsBuiltInRole]::Administrator
# Check to see if we are currently running "as Administrator"
if ($myWindowsPrincipal.IsInRole($adminRole))
{
 # We are running "as Administrator" - so change the title and background color to indicate this
 $Host.UI.RawUI.WindowTitle = $myInvocation.MyCommand.Definition + "(Elevated)"
 $Host.UI.RawUI.BackgroundColor = "DarkBlue"
 clear-host
}
else
{
 # We are not running "as Administrator" - so relaunch as administrator
 # Create a new process object that starts PowerShell
 $newProcess = new-object System.Diagnostics.ProcessStartInfo "PowerShell";
 # Specify the current script path and name as a parameter
 $newProcess.Arguments = $myInvocation.MyCommand.Definition + " -Step $Step";
 # Indicate that the process should be elevated
 $newProcess.Verb = "runas";
 # Start the new process
 [System.Diagnostics.Process]::Start($newProcess);
 # Exit from the current, unelevated, process
 exit
}
#######################################################################################################################################
$MyDir = [System.IO.Path]::GetDirectoryName($myInvocation.MyCommand.Definition)
Set-Location $MyDir
[reflection.assembly]::LoadWithPartialName("Microsoft.UpdateServices.Administration") | Out-Null
$wsus = [Microsoft.UpdateServices.Administration.AdminProxy]::getUpdateServer('localhost',$False,8530) #Change to SCCM server name
 
$computerscope = New-Object Microsoft.UpdateServices.Administration.ComputerTargetScope
$updatescope = New-Object Microsoft.UpdateServices.Administration.UpdateScope
#Exclude the following states from update list
$updatescope.ExcludedInstallationStates = 'NotApplicable','Unknown','Installed'
 
#Create Forward and Reverse lookup
$groups = @{}
$dataHolder = @()
$wsus.GetComputerTargetGroups() | ForEach {$groups[$_.Name]=$_.id;$groups[$_.ID]=$_.name}
 
Do {
$keepRunning = $true
Write-Host "
----------MENU----------------------------
1 = List WSUS Groups
2 = Pull Updates For Entire WSUS Group
3 = Quit
------------------------------------------"
$choice1 = read-host -prompt "Select number & press enter:"
 
Switch ($choice1) {
"1" {$wsus.GetComputerTargetGroups().Name}
"2" {
 $DataHolder = @()
 $computerscope4 = New-Object Microsoft.UpdateServices.Administration.ComputerTargetScope
# $updatescope4 = New-Object Microsoft.UpdateServices.Administration.UpdateScope
 #Only list updates that are needed
# $updatescope4.ExcludedInstallationStates = 'NotApplicable','Unknown','Installed'
 #Only list updates that are approved
# $updatescope4.ApprovedStates = [Microsoft.UpdateServices.Administration.ApprovedStates]::LatestRevisionApproved;
 #$updatescope4.Categories = "Critical Updates"
#$updatescope4.ExcludeOptionalUpdates = $true
#$updatescope4.TextNotIncludes = "Language Pack"

#Installed Updates
$updatescope4 = New-Object Microsoft.UpdateServices.Administration.UpdateScope
 #Only list updates that are needed
 $updatescope4.IncludedInstallationStates = 'Installed'
 #Only list updates that are approved
 $updatescope4.ApprovedStates = [Microsoft.UpdateServices.Administration.ApprovedStates]::LatestRevisionApproved;
 



 $TargetGroup = Read-Host -prompt "Please enter a group name:"
 
 $pcgroup = @($wsus.GetComputerTargets($computerscope4) | Where {$_.ComputerTargetGroupIds -eq $groups[$TargetGroup]}) | Select -expand Id
 
 $pcinfo = $wsus.GetSummariesPerComputerTarget($updatescope4,$computerscope4) | Where {$pcgroup -Contains $_.ComputerTargetID} | ForEach {
 $computerscope2 = New-Object Microsoft.UpdateServices.Administration.ComputerTargetScope
 $computerscope2.NameIncludes = $wsus.GetComputerTarget(([guid]$_.ComputerTargetId)).FullDomainName
  
 $pcupSum = ($wsus.GetSummariesPerUpdate($updatescope4,$computerscope2) | ForEach-Object {($wsus.GetUpdate($_.UpdateId).Title)})
  
  
 $data = New-Object PSObject -Property @{
 "Client" = $wsus.GetComputerTarget(([guid]$_.ComputerTargetId)).FullDomainName
 "IP Address" = $wsus.GetComputerTarget(([guid]$_.ComputerTargetId)).IPAddress
 "Group" = $wsus.GetComputerTarget(([guid]$_.ComputerTargetId)).RequestedTargetGroupName
 "Updates" = ($_.NotInstalledCount + $_.DownloadedCount)
 "Failed" = $_.FailedCount
 "LastSync" = $wsus.GetComputerTarget(([guid]$_.ComputerTargetId)).LastReportedStatusTime
 "Titles" = $pcupSum | Out-String
 }
  
 $DataHolder += $data | Select Client,"IP Address",Group,Updates,Failed,LastSync,Titles | Where {$_.Updates -ne "0"}
 
 }
 #Display table in PS Window. Commented out due to being too large of a table to display properly.
 #$DataHolder | Select Client,"IP Address",Group,Updates,Failed,LastSync,Titles| Sort LastSync -Descending |
 #Format-Table -Wrap -Autosize @{L="Last Sync with WSUS";E={$_.LastSync};align='left'},@{L="Host Name";E={$_.Client};align='center'},"IP Address",@{L="WSUS Group";E={$_.Group};align='center'},@{L="# Needed";E={$_.Updates};align='center'},@{L="Failed";E={$_.Failed};align='center'},@{L="Updates Titles";E={$_.Titles};align='left'}
  
 #Create CSV
 $DataHolder | Select LastSync,Client,"IP Address",Group,Updates,Failed,Titles | Sort LastSync -Descending | Export-Csv "$TargetGroup.csv" -NoTypeInformation
 #Display GridView Popup
 $DataHolder | Select LastSync,Client,"IP Address",Group,Updates,Failed,Titles | Sort LastSync -Descending | Out-GridView -Title $TargetGroup
 
 $DataHolder= @()
 $pcupSum = ""
 }
"3" {$keepRunning = $False
 exit 
 }
}
} while ($keepRunning -eq $true)