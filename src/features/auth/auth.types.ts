export interface User {
  id?: number
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

export type FieldErrors<T extends string> = Partial<Record<T, string>>
