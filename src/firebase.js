import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

const firebaseConfig = {
  apiKey: 'AIzaSyDMvSyTEhJGh7a0coyDWCDiAsWCgxE9QsU',
  authDomain: 'realcitytransport.firebaseapp.com',
  databaseURL: 'https://realcitytransport-default-rtdb.firebaseio.com',
  projectId: 'realcitytransport',
  storageBucket: 'realcitytransport.firebasestorage.app',
  messagingSenderId: '510805652928',
  appId: '1:510805652928:web:0559bdd8da50af10b7c425',
  measurementId: 'G-JE98MMZMCW',
}

const app = initializeApp(firebaseConfig)

export const database = getDatabase(app)