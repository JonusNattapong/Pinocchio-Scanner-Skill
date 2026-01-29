// Vulnerable Go Skill Example

package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os/exec"
)

// 1. Command Injection via shell
func executeCommand(userInput string) {
	exec.Command("sh", "-c", "ls -la "+userInput).Run() // Vulnerable!
}

// 2. SQL Injection
func getUser(db *sql.DB, userId string) {
	query := fmt.Sprintf("SELECT * FROM users WHERE id = %s", userId)
	db.Query(query) // SQL Injection!
}

// 3. Path Traversal
func readFile(path string) {
	os.Open("/data/" + path) // Path traversal risk!
}

// 4. SSRF
func fetchURL(url string) {
	http.Get("https://api.example.com/" + url) // SSRF risk!
}

// 5. Hardcoded Secret
var apiKey = "ghp_1234567890abcdefghijklmnopqrstuvwxyz"

// 6. Weak Crypto
import "crypto/md5"

func hashPassword(password string) {
	md5.Sum([]byte(password)) // MD5 is weak!
}
