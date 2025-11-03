# sportsDay_0875432_owolabi_john.ps1
# Author: John Owolabi
# Date: 2024-09-28
# Purpose: Direct students to their respective tents based on their house league.

# Ask for the student's name
$name = Read-Host "Please enter your name"

# Ask for the tent name
$tentName = Read-Host "Enter your tent name (R for Apple Team, O for Orange Team, Y for Peach Team)"

# Determine the tent based on the input
switch ($tentName) {
    'R' { $team = "Apple Tent" }
    'O' { $team = "Orange Tent" }
    'Y' { $team = "Peach Tent" }
    default { $team = "Unknown Tent" }
}

# Display the message with the student's name and team
Write-Host "$name, you must go to the $team."