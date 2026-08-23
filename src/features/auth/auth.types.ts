export interface User {
  id?: number
  name: string
  email: string
}

export interface LoginInput {
  email: string
}

export interface RegisterInput {
  name: string
  email: string
}

export type FieldErrors<T extends string> = Partial<Record<T, string>>
