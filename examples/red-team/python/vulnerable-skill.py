# Vulnerable Python Skill Example

import os
import pickle
import yaml

# 1. Command Injection (os.system)
def execute_command(user_input):
    os.system("ls -la " + user_input)  # Vulnerable!

# 2. Command Injection (subprocess with shell=True)
import subprocess
def run_shell(cmd):
    subprocess.run(cmd, shell=True)  # Vulnerable!

# 3. Code Injection (eval)
def dynamic_calc(expression):
    result = eval(expression)  # Dangerous: executes arbitrary code
    return result

# 4. Unsafe Deserialization (pickle)
def load_data(data):
    return pickle.loads(data)  # Can execute arbitrary code!

# 5. Unsafe YAML loading
def parse_config(yaml_str):
    config = yaml.load(yaml_str)  # Should use safe_load!
    return config

# 6. SQL Injection
def get_user(db, user_id):
    query = f"SELECT * FROM users WHERE id = {user_id}"
    db.execute(query)  # SQL Injection!

# 7. Hardcoded Secret
API_KEY = "sk-live-12345abcde67890fghij"
