import { secrets } from "./secrets";

export const config = {
    db: {
        url: secrets.url,
        name: "todo-api",
        testName: "todo-api-test",
        collections: {
            todoItems: "todo-items",
            sequences: "sequences"
        }, 
        sequences: {
            toDoItemId: 'todo-item-id'
        }
    }
}