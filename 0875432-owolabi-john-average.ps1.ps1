# Author: John Owolabi
# Date: 2024-07-24
# Purpose: Calculate the total restaurant bill for Cosmos Restaurant

# Display a welcome message
Write-Output "Welcome to Cosmos Restaurant!"

# Ask the user for their name
$userName = Read-Host "Please enter your name"

# Display the menu
Write-Output "Menu:"
Write-Output "1. Blueberry cupcake - $10.99"
Write-Output "2. Nebula nachos - $5.99"
Write-Output "3. Sun Red cake - $8.99"
Write-Output "4. Mars raspberry coffee - $4.99"

# Prices of the menu items
$price1 = 10.99
$price2 = 5.99
$price3 = 8.99
$price4 = 4.99

# Ask the user for the quantity of each item
$quantity1 = [int](Read-Host "Enter the quantity for Blueberry cupcake")
$quantity2 = [int](Read-Host "Enter the quantity for Nebula nachos")
$quantity3 = [int](Read-Host "Enter the quantity for Sun Red cake")
$quantity4 = [int](Read-Host "Enter the quantity for Mars raspberry coffee")

# Calculate the total cost for each item
$total1 = $price1 * $quantity1
$total2 = $price2 * $quantity2
$total3 = $price3 * $quantity3
$total4 = $price4 * $quantity4

# Calculate the total bill
$totalBill = $total1 + $total2 + $total3 + $total4

# Calculate the average bill
$averageBill = $totalBill / 4

# Display the customer's name and the total cost of all items
Write-Output "Customer Name: $userName"
Write-Output "Menu Selection 1: Blueberry cupcake - $total1"
Write-Output "Menu Selection 2: Nebula nachos - $total2"
Write-Output "Menu Selection 3: Sun Red cake - $total3"
Write-Output "Menu Selection 4: Mars raspberry coffee - $total4"
Write-Output "Total: $totalBill"
Write-Output "Average: $averageBill"