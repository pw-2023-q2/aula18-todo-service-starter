import {strict as assert} from "assert"
import { Database } from "./database"
import * as model from "./model"
import { ToDoId, ToDoItem, ToDoItemDAO, ToDoItemDTO } from "./model"
import { suiteTeardown } from "mocha"
import { Db } from "mongodb"
import { config } from "../conf/config"

/**
 * Mock database.
 */
class MockDatabase extends Database {
    /**
     * Starts an empty mock database.
     */
    constructor() {
        super()
    }

    /**
     * Get the mock database.
     * 
     * @returns the mock database
     */
    override getDb(): Db {
        return this.client.db(config.db.testName)
    }
}

class MockToDoItemDAO extends ToDoItemDAO {

    async removeAll() {
        await this.getItemCollection().deleteMany({})
    }
}

/**
 * A suite of tests for the DAO.
 */
suite("Test DAO", () => {
    /**
     * Global suite variables.
     */
    
    const database = new MockDatabase()
    const dao = new MockToDoItemDAO(database)

    suiteSetup(async () => {
        await database.connect()
        await dao.removeAll()
    })

    suiteTeardown(async () => await database.disconnect())

    test("Insert should be successfull", async () => {
        try {
            await dao.insert(new ToDoItem("Do something"))
        } catch(error) {
            console.error(error)
            assert.fail("Insert should not throw error")
        }
    })

    test("List all should return at least one element", async () => {
        try {
            await dao.insert(new ToDoItem('whatever'))
            assert.equal((await dao.list()).length > 1, true, "At least one element should be returned")
        } catch(error) {
            console.error(error)
            assert.fail("Test should not throw error")
        }
    })    

    test("Insert should increase quantity of elements", async () => {
        try {
            const itemsBefore = await dao.list()
            const item = new model.ToDoItem("Do something new")

            await dao.insert(item)

            const itemsAfter = await dao.list()

            assert.equal(itemsAfter.length - itemsBefore.length, 1, "Quantity out of expected")   
        } catch(error) {
            console.error(error)
            assert.fail("Test should not throw error")
        }
    })

    test("Retrieved element is equal to inserted element", async () => {
        try {
            const item = new model.ToDoItem("A random task")

            item.deadline = new Date(Date.parse("01/01/2001")).toUTCString()
            item.tags = ["tag4", "tag5"]
            item.id = await dao.insert(item)
            
            const retrItem = await dao.findById(item.id)

            assert.equal(item.equals(retrItem), true, `Items are not equal: ${JSON.stringify(item)} ${JSON.stringify(retrItem)}`)   
        } catch(error) {
            console.error(error)
            assert.fail("Test should not throw error")
        }
    })
    

    test("Remove should decrease quantity of elements", async () => {
        try {
            const before = await dao.list()

            if (before.length < 1) {
                throw new Error("Not enough elements to perform the test")
            }

            const status = await dao.removeById(before[0].id)

            assert.equal(status, true, "Remove should be successfull")

            const after = await dao.list()

            assert.equal(before.length - after.length, 1, "Quantity not decreased")   
        } catch(error) {
            console.error(error)
            assert.fail("Test should not throw error")
        }
    })

    test("Valid id should return a valid element", async () => {
        try {
            const allElements = await dao.list()

            for (const el of allElements) {
                const retrEl = await dao.findById(el.id)

                assert.equal(el.id, retrEl.id, "Element does not match id")
            }    
        } catch(error) {
            console.error(error)
            assert.fail("Test should not throw error")
        }
        
    })

    test("Invalid id should return no element", async () => {
        try {
            await dao.findById(-1)
            assert.fail("Invalid id should raise exception")
        } catch(error) {}
    })

    test("Update with valid id is successfull", async () => {
        try {
            const items = await dao.list()

            assert.equal(items.length > 1, true, "Impossible to update an empty collection")
            
            const item = await dao.findById(items[0].id)
            
            item.description = 'modified description'
            assert.equal(await dao.update(item), true)   
        } catch(error) {
            console.error(error)
            assert.fail("Test should not throw error")
        }
    })

    test("Update with invalid id is unsuccessfull", async () => {   
        try {
            const item = new model.ToDoItem("Test")

            item.id = -1
            assert.equal(await dao.update(item), false)
        } catch(error) {
            console.error(error)
            assert.fail("Test should not throw error")
        }     
    })

    test("Update changes description", async () => {
        try {
            const items = await dao.list()

            assert.equal(items.length > 1, true, "Impossible to update an empty collection")
            
            const item = await dao.findById(items[0].id)
            const newDesc = "Test description"

            assert.notEqual(item.description, newDesc, "Descriptions should differ")
            item.description = newDesc

            await dao.update(item)

            const retrItem = await dao.findById(item.id)

            assert.equal(retrItem.description, newDesc, "Updated description does not match expected value")   
        } catch(error) {
            console.error(error)
            assert.fail("Test should not throw error")
        }
    })

    test("Remove should decrease quantity of elements", async () => {
        try {
            const itemsBefore = await dao.list()

            assert.equal(itemsBefore.length > 1, true, "Impossible to update an empty collection")
            
            await dao.removeById(itemsBefore[0].id)
            const itemsAfter = await dao.list()
    
            assert.equal(itemsBefore.length - itemsAfter.length, 1, "Resulting quantity out of expected")   
        } catch(error) {
            console.error(error)
            assert.fail("Test should not throw error")
        }
    })
})