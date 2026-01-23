// Sample TypeScript file for testing search_code_usage tool

interface User {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
}

class UserService {
  private users: User[] = [];

  constructor() {
    this.users = [];
  }

  async getUserById(id: number): Promise<User | undefined> {
    const user = this.users.find(u => u.id === id);
    return user;
  }

  addUser(user: User): User {
    this.users.push(user);
    return user;
  }

  removeUser(id: number): boolean {
    const index = this.users.findIndex(u => u.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }

  getUsers(): User[] {
    return [...this.users];
  }
}

function createUser(name: string, email: string): User {
  const user: User = {
    id: Date.now(),
    name: name,
    email: email,
    createdAt: new Date()
  };
  return user;
}

// Usage examples
const userService = new UserService();
const newUser = createUser("Alice Smith", "alice@example.com");
userService.addUser(newUser);

// Function call
const foundUser = await userService.getUserById(newUser.id);
console.log(foundUser);

// Property access
console.log(userService.getUsers().length);
