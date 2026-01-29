// Vulnerable Rust Skill Example

use std::process::Command;
use std::fs::File;

// 1. Command Injection via format!
fn execute_command(user_input: &str) {
    Command::new("sh")
        .arg("-c")
        .arg(format!("ls -la {}", user_input)) // Vulnerable!
        .spawn()
        .expect("failed to execute");
}

// 2. Unsafe block
fn risky_operation() {
    unsafe {
        // Bypasses Rust's safety guarantees
        let ptr: *const i32 = std::ptr::null();
        println!("{:?}", *ptr);
    }
}

// 3. Path Traversal
fn read_user_file(filename: &str) {
    let path = format!("/data/{}", filename);
    File::open(path).unwrap(); // Path traversal risk!
}

// 4. Transmute danger
fn dangerous_cast() {
    let x: i32 = 42;
    let y: f32 = unsafe { std::mem::transmute(x) }; // UB risk!
}

// 5. Hardcoded Secret
const API_KEY: &str = "sk-prod-abcdefghijklmnop123456789";

// 6. Panic in production
fn divide(a: i32, b: i32) -> i32 {
    let result = a.checked_div(b).unwrap(); // May panic!
    result
}
