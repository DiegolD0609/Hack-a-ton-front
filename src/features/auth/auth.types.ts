export interface User {
  name: string
  email: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput extends LoginInput {
  name: string
}

export interface AuthService {
  login: (input: LoginInput) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
}

export type FieldErrors<T extends string> = Partial<Record<T, string>>
