// Sample JavaScript file for testing search_code_usage tool

class UserService {
  constructor() {
    this.users = [];
  }

  async getUserById(id) {
    const user = this.users.find(u => u.id === id);
    return user;
  }

  addUser(user) {
    this.users.push(user);
    return user;
  }

  removeUser(id) {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
    }
  }
}

function createUser(name, email) {
  const user = {
    id: Date.now(),
    name: name,
    email: email,
    createdAt: new Date()
  };
  return user;
}

const userService = new UserService();
const newUser = createUser("John Doe", "john@example.com");
userService.addUser(newUser);

// Function call
const foundUser = userService.getUserById(newUser.id);
console.log(foundUser);

// Property access
console.log(userService.users.length);
