# Sample Python file for testing search_code_usage tool

class UserService:
    def __init__(self):
        self.users = []
    
    def get_user_by_id(self, user_id):
        """Get user by ID"""
        for user in self.users:
            if user.id == user_id:
                return user
        return None
    
    def add_user(self, user):
        """Add a new user"""
        self.users.append(user)
        return user
    
    def remove_user(self, user_id):
        """Remove user by ID"""
        self.users = [u for u in self.users if u.id != user_id]

def create_user(name, email):
    """Create a new user object"""
    user = {
        'id': int(time.time()),
        'name': name,
        'email': email,
        'created_at': datetime.now()
    }
    return user

# Usage examples
user_service = UserService()
new_user = create_user("Jane Doe", "jane@example.com")
user_service.add_user(new_user)

# Function call
found_user = user_service.get_user_by_id(new_user['id'])
print(found_user)

# Property access
print(len(user_service.users))
