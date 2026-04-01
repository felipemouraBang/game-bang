import bcrypt from 'bcryptjs';

const password = 'Moura';
const hash = '$2b$10$YhPOrK/Z65thWF2.nV46M.Bd7OjOaCX7fSjNX5YvssGjOeD2noCQO';

const isValid = bcrypt.compareSync(password, hash);
console.log('Is password valid?', isValid);
