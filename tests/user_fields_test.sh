#!/bin/bash

# Text colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

# Base URL for the API
BASE_URL="http://localhost:3000/api"

echo "Testing new user fields implementation..."

# Test 1: Register a cricket player
echo -e "\nTest 1: Register a cricket player"
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Cricket Player",
    "email": "cricket@test.com",
    "password": "Test123!",
    "role": "player",
    "age": 25,
    "playingRole": "Batsman",
    "sport": "Cricket",
    "gender": "Male",
    "cricketRole": "Batsman"
  }')

if echo "$REGISTER_RESPONSE" | grep -q "success\":true"; then
  echo -e "${GREEN}✓ Cricket player registration successful${NC}"
else
  echo -e "${RED}✗ Cricket player registration failed${NC}"
  echo "Response: $REGISTER_RESPONSE"
  exit 1
fi

# Extract token from login
echo -e "\nLogging in as cricket player"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cricket@test.com",
    "password": "Test123!"
  }')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
USER_ID=$(echo "$LOGIN_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)

# Test 2: Update profile of cricket player
echo -e "\nTest 2: Update cricket player profile"
UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/profile/$USER_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "cricketRole": "All-Rounder",
    "gender": "Male"
  }')

if echo "$UPDATE_RESPONSE" | grep -q "success\":true"; then
  echo -e "${GREEN}✓ Cricket player profile update successful${NC}"
else
  echo -e "${RED}✗ Cricket player profile update failed${NC}"
  echo "Response: $UPDATE_RESPONSE"
  exit 1
fi

# Test 3: Register a non-cricket player
echo -e "\nTest 3: Register a non-cricket player"
REGISTER_RESPONSE2=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Football Player",
    "email": "football@test.com",
    "password": "Test123!",
    "role": "player",
    "age": 23,
    "playingRole": "Forward",
    "sport": "Football",
    "gender": "Female"
  }')

if echo "$REGISTER_RESPONSE2" | grep -q "success\":true"; then
  echo -e "${GREEN}✓ Football player registration successful${NC}"
else
  echo -e "${RED}✗ Football player registration failed${NC}"
  echo "Response: $REGISTER_RESPONSE2"
  exit 1
fi

# Test 4: Try to register with invalid cricket role
echo -e "\nTest 4: Try to register with invalid cricket role"
INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Invalid Cricket Player",
    "email": "invalid@test.com",
    "password": "Test123!",
    "role": "player",
    "age": 24,
    "playingRole": "Batsman",
    "sport": "Cricket",
    "gender": "Male",
    "cricketRole": "Invalid"
  }')

if echo "$INVALID_RESPONSE" | grep -q "success\":false"; then
  echo -e "${GREEN}✓ Invalid cricket role rejected successfully${NC}"
else
  echo -e "${RED}✗ Invalid cricket role validation failed${NC}"
  echo "Response: $INVALID_RESPONSE"
  exit 1
fi

# Test 5: Try to register cricket player without cricket role
echo -e "\nTest 5: Try to register cricket player without cricket role"
MISSING_ROLE_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Missing Role Player",
    "email": "missing@test.com",
    "password": "Test123!",
    "role": "player",
    "age": 22,
    "playingRole": "Batsman",
    "sport": "Cricket",
    "gender": "Male"
  }')

if echo "$MISSING_ROLE_RESPONSE" | grep -q "success\":false"; then
  echo -e "${GREEN}✓ Missing cricket role caught successfully${NC}"
else
  echo -e "${RED}✗ Missing cricket role validation failed${NC}"
  echo "Response: $MISSING_ROLE_RESPONSE"
  exit 1
fi

echo -e "\n${GREEN}All tests completed successfully!${NC}"