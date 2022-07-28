import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { TodoItem } from '../models/TodoItem'
import { CreateTodoRequest } from '../requests/CreateTodoRequest'
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest'

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// DOING: Implement the dataLayer logic

export class TodosAccess {
    constructor(
      private readonly todosTable = process.env.TODOS_TABLE,
      private readonly docClient: DocumentClient = createDocClient()
      ) {
    }

    async getTodosForUser(userId: string) {
      const result = await this.docClient.query({
        TableName: this.todosTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        },
        ScanIndexForward: false
      }).promise()

      logger.info('Successfully retrieved todo items for user', {
          userId: userId
      })
      return result.Items as TodoItem[]
    }

    async createTodo(userId: string, todoId: string, newTodo: CreateTodoRequest) {
      const bucketName = process.env.ATTACHMENT_S3_BUCKET
      const newItem = {
        todoId,
        userId,
        createdAt: JSON.stringify(Date.now()),
        attachmentUrl: `https://${bucketName}.s3.amazonaws.com/${todoId}`,
        ...newTodo
      }
      await this.docClient
      .put({
        TableName: this.todosTable,
        Item: newItem
      })
      .promise()

      logger.info("Successfully created todo for user", {
        userId: userId,
        todoId: todoId
      })

      return newItem
    }

    async updateTodo (userId: string, todoId: string, updatedTodo: UpdateTodoRequest) {

      logger.info("Updating todo for user", {
        userId: userId,
        todoId: todoId
      })

      await this.docClient.update({
        TableName: this.todosTable,
        Key: { userId: userId, todoId: todoId },
        AttributeUpdates: {
          name: {
            Action: "PUT",
            Value: updatedTodo.name
          },
          dueDate: {
            Action: "PUT",
            Value: updatedTodo.dueDate
          },
          done: {
            Action: "PUT",
            Value: updatedTodo.dueDate
          }
        },
      }).promise()

      logger.info("Successfully updated todo for user", {
        userId: userId,
        todoId: todoId
      })
    }

    async deleteTodo(userId: string, todoId: string) {
      await this.docClient.delete({
        TableName: this.todosTable,
        Key: { userId: userId, todoId: todoId },
        ConditionExpression: 'todoId = :todoId',
        ExpressionAttributeValues: {
          ':todoId': todoId
        }
      }).promise()

      logger.info("Successfully deleted todo for user", {
        userId: userId,
        todoId: todoId
      })
    }
}

function createDocClient() {
  if (process.env.IS_OFFLINE) {
      logger.info('Creating a local DynamoDB instance')
      return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
  }
  
  return new XAWS.DynamoDB.DocumentClient()
}