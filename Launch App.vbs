' ══════════════════════════════════════════════════
'  Loan Calculator — Desktop Shortcut Installer
'
'  Run this ONCE. It creates a "Loan Calculator"
'  shortcut on your Desktop with the app's icon.
'
'  No Python, Node.js, or anything else required.
' ══════════════════════════════════════════════════

Dim oShell, oFSO, sDir, sDesktop, sShortcut, oLink

Set oShell = CreateObject("WScript.Shell")
Set oFSO   = CreateObject("Scripting.FileSystemObject")

' Folder where this VBS lives (same as index.html)
sDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))

' Verify index.html exists here
If Not oFSO.FileExists(sDir & "index.html") Then
    MsgBox "Could not find index.html in:" & vbCrLf & sDir & vbCrLf & vbCrLf & _
           "Please make sure this file is in the loan-calculator folder.", _
           vbCritical, "Loan Calculator Setup"
    WScript.Quit 1
End If

' Verify icon exists
Dim sIcon
If oFSO.FileExists(sDir & "icon.ico") Then
    sIcon = sDir & "icon.ico"
Else
    sIcon = ""  ' Windows will use default browser icon as fallback
End If

' Target path: open index.html in default browser
sDesktop  = oShell.SpecialFolders("Desktop")
sShortcut = sDesktop & "\Loan Calculator.lnk"

Set oLink = oShell.CreateShortcut(sShortcut)
oLink.TargetPath     = sDir & "index.html"
oLink.WorkingDirectory = sDir
oLink.Description    = "Open Loan Calculator"
If sIcon <> "" Then oLink.IconLocation = sIcon
oLink.Save

Set oLink  = Nothing
Set oShell = Nothing
Set oFSO   = Nothing

MsgBox "All done!" & vbCrLf & vbCrLf & _
       "A 'Loan Calculator' shortcut with the app icon" & vbCrLf & _
       "has been added to your Desktop." & vbCrLf & vbCrLf & _
       "Double-click it any time to open the calculator.", _
       vbInformation, "Loan Calculator Setup"
