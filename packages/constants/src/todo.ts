// Portée d'une liste de tâches (CONTEXT.md : liste perso, partagée, d'événement).
export const TODO_LIST_KINDS = ["PERSONAL", "SHARED", "EVENT"] as const;
export type TodoListKind = (typeof TODO_LIST_KINDS)[number];

// Teintes de liste de la maquette « Doux et vivant » (packages/tokens).
export const LIST_TINTS = ["general", "work", "couple", "trip"] as const;
export type ListTint = (typeof LIST_TINTS)[number];
