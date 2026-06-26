import { hash } from 'bcryptjs'

const password = 'admin123'
hash(password, 12).then(hashed => {
  console.log(hashed)
})