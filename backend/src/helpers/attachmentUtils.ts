import * as AWS from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { createLogger } from '../utils/logger'

const XAWS = AWSXRay.captureAWS(AWS)

const s3 = new XAWS.S3({
    signatureVersion: 'v4'
  })

const logger = createLogger('AttachmentUtils')
const s3Bucket = process.env.ATTACHMENT_S3_BUCKET
const presignedUrlExpiration = Number(process.env.SIGNED_URL_EXPIRATION)

// TODO: Implement the fileStogare logic

export class AttachmentUtils {
    constructor() {}
    
    createAttachmentPresignedUrl(todoId: string) {
        try {
            const signedUrl = s3.getSignedUrl('putObject', {
                Bucket: s3Bucket,
                Key: todoId,
                Expires: presignedUrlExpiration
            })

            logger.info('Generated signed url', {signedUrl})
            return signedUrl
        } catch (e: any) {
            logger.error('error generated signed url', {e})
        }
        
    }
}