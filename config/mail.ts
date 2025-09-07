import env from '#start/env'
import { defineConfig, transports } from '@adonisjs/mail'

const mailConfig = defineConfig({
  default: 'smtp',

   /**
    * The mailers object can be used to configure multiple mailers
    * each using a different transport or same transport with different
    * options.
   */
  mailers: { 
    smtp: transports.smtp({
      host: 'smtp.gmail.com',
      port: 465,
			/**
       * Uncomment the auth block if your SMTP
       * server needs authentication
       */
      auth: {
        type: 'login',
        user: 'kathysatera@gmail.com',
        pass: 'iiih aksm tnnr aeeq',
      },
    }),
		     
  },
})

export default mailConfig

declare module '@adonisjs/mail/types' {
  export interface MailersList extends InferMailers<typeof mailConfig> {}
}