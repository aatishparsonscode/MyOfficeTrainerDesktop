// @ts-nocheck

import { useEffect,useState } from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { Amplify } from 'aws-amplify';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import awsExports from '../aws-exports';
import ExerciseDash from './components/ExerciseDash';

const graphEndpoint = 'https://5svlsqazprczhjboidlzkvhfyy.appsync-api.us-west-2.amazonaws.com/graphql'

const createUsersExercise = /* GraphQL */ `
  mutation CreateUsersExercise($input: CreateUsersExerciseInput!) {
    createUsersExercise(input: $input) {
      UserID
      BodyPosition
      Difficulty
      Email
      ExerciseInterval
      IgnoreExercises
      LastExerciseTime
      Location
      PrevExercise
      SkippedExercises
      DeliveryMethod
      WindowStartHour
      WindowEndHour
      WindowDays
      RequestedExercise
      GoogleCalendarEnabled
      GoogleCalendarRefreshToken
      SlackAccessToken
      SlackUserID
      Movement
      __typename
    }
  }
`;

const getUsersExercise = /* GraphQL */ `
  query GetUsersExercise($UserID: String!) {
    getUsersExercise(UserID: $UserID) {
      UserID
      BodyPosition
      Difficulty
      Email
      ExerciseInterval
      IgnoreExercises
      LastExerciseTime
      Location
      PrevExercise
      SkippedExercises
      DeliveryMethod
      WindowStartHour
      WindowEndHour
      WindowDays
      RequestedExercise
      GoogleCalendarEnabled
      GoogleCalendarRefreshToken
      SlackAccessToken
      SlackUserID
      Movement
      DesktopConnectionID
      DesktopLive
      OutlookCalendarEnabled
      OutlookCalendarRefreshToken
      __typename
    }
  }
`;

const BODY_PARTS_DEFAULT_DIFFICULTY = {	
  "Quadriceps": "Easy",
  "Hamstrings": "Easy",
  "Calves": "Easy",
  "Latissimus_dorsi": "Easy",
  "Trapezius": "Easy",
  "Rhomboids": "Easy",
  "Pectoralis_major": "Easy",
  "Deltoids": "Easy",
  "Rotator_cuff_muscles": "Easy",
  "Biceps": "Easy",
  "Triceps": "Easy",
  "Rectus_abdominis": "Easy",
  "Obliques": "Easy",
  "Lower_back": "Easy",
}

const {ipcRenderer} = window.require('electron')

Amplify.configure(awsExports)

export const sendData = (data : String) => {
  ipcRenderer.send("sendCredsToBackend", JSON.stringify(data));
  };
  ipcRenderer.on("backendReply", (event, arg) => {
    console.log(arg);
  });

const restartApp = () => {
  ipcRenderer.send("restartApp", true);
};

const minimizeApp = () => {
  ipcRenderer.send("minimizeApp", true);
};

function convertLocalToUniversalDate(dateLocal){
  console.log(dateLocal, "date")
  const date = new Date(dateLocal)
  let utc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(),
                  date.getUTCDate(), date.getUTCHours(),
                  date.getUTCMinutes(), date.getUTCSeconds());
  return new Date(utc)
}

const getUser = async (UUID) => {
  console.log("SEARCHING FOR: ", UUID)
  let data = null
  let status = null
  await fetch(graphEndpoint, {
    method : 'POST',
    headers: {'Content-Type': 'application/json',
              'x-api-key' : 'da2-l25ddq7nvbghfbdp7imeg36ssi'
            },
    body : JSON.stringify({
      query: getUsersExercise,
      variables: {
        UserID : UUID
      }
    })
  }).then(async res => {
    console.log(res, "user get")
    status = res.status
    if(res.ok){
      data = (await res.json()).data.getUsersExercise
      console.log(data, "user data")
    }
    
  })
  return {data : data, status : status }
}

const createUser = async (UUID, email) => {
  console.log("CREATING USER")
  
  const WindowStartLocal = new Date().setHours(10,0)
  const WindowEndLocal = new Date().setHours(16,0)
  const WindowStartUTC = convertLocalToUniversalDate(WindowStartLocal)
  const WindowEndUTC = convertLocalToUniversalDate(WindowEndLocal)
  
  const WindowStartSummed = WindowStartUTC.getUTCHours() * 60 + WindowStartUTC.getUTCMinutes()
  const WindowEndSummed = WindowEndUTC.getUTCHours() * 60 + WindowEndUTC.getUTCMinutes()

  const response = await fetch(graphEndpoint, {
    method : 'POST',
    headers: {'Content-Type': 'application/json',
              'x-api-key' : 'da2-l25ddq7nvbghfbdp7imeg36ssi'
            },
    body : JSON.stringify({
      query: createUsersExercise,
      variables: {
        input: {
          UserID : UUID,
          BodyPosition : "Standing",
          Difficulty : BODY_PARTS_DEFAULT_DIFFICULTY, 
          Email : email,
          ExerciseInterval : 40,
          IgnoreExercises : [],
          LastExerciseTime : 0,
          Location : "office",
          PrevExercise: "none",
          SkippedExercises: [],
          DeliveryMethod: "DESKTOP_APP",
          WindowStartHour: WindowStartSummed,
          WindowEndHour: WindowEndSummed,
          WindowDays: [false, true,true,true,true,true,false], //Weekdays only
          RequestedExercise: false,
          Movement: "STRETCH"
        } 
      }
    })
  })//.then(async res => {
  //   data = await res.json()
  //   console.log(data, "Creation call data")

  //   //[{"key" : "Latissimus dorsi", "value" : "EASY"}, {"key" : "Quadriceps", "value" : "EASY"}],
  // })
  const jsonData = await response.json()
  return jsonData.data.createUsersExercise
  // console.log(jsonData, "Data before ok check create user")
  // if(jsonData.ok){
  //   return {data : jsonData.data.createUsersExercise, status : jsonData.status }
  // }else{
  //   return {data : null, status : jsonData.status }
  // }
  
}


function App({ user, signOut  }) {
  const [updateCount, setUpdateCount] = useState(0)
  const [connected, setConnected] = useState(true)
  const [loading, setLoading] = useState(true)
  const [trace, setTrace] = useState(null)

  ipcRenderer.addListener('newExercise', (event, arg) => {
    console.log('Message from main process:', arg);
    setUpdateCount(updateCount + 1)
  });

  ipcRenderer.on('connection-status', function(event, message){
    console.log(message)
    console.log("IPC RENDERER CONNECCTION")
    if(message == 'live'){
      setConnected(true)
    }else{
      setConnected(false)
    }
    
  })

  console.log(user)
  const {userId} = user

  //const email = user.signInDetails.loginId // not there
  useEffect(() => {
   // signOut()
    async function setupUser(UserID){
      
      let getUserData = (await getUser(UserID))
      console.log(getUserData)
      let userData = getUserData.data
      let userStatus = getUserData.status
      
      if(userData === null && userStatus === 200){ //doesn't exist in DB
        setTrace(trace + "\n creating user with email")
        try{
          const email = user.signInDetails.loginId
          const creationData = await createUser(UserID, email)
          console.log(creationData, "creation Data")
          userData = creationData
          setTrace(trace + "\n created user with email")
          // temp solution - bascially the connection string stuff might go before user is created which can screw things up
          setTimeout(() => sendData(userId), 1000)
        }catch(error){
          signOut()
        }
        
        //alert("Welcome! Head over to settings if you want to make any changes to the default configuration.")
        setTrace(trace + "\n\n In creation")
      }else if(userStatus === 200){
        // user exists and valid
        sendData(userId)
        setTrace(trace + "\n\n In 200 status")
      }else{
        sendData(userId)
        setTrace(trace + "\n\n In 400 status")
      }
      console.log(userData, "After setup data")
        
      setLoading(false)
      
      
      // Difficulty will be stringified!
    }

    if(userId !== null){
      // signOut()
      // console.log("running setup", userId, email)
      setupUser(userId)
      
    }else{
      console.log("something wrong")
      setLoading(false)
    }
    
    console.log(userId, user, "USE EFFECT")
    setTrace(JSON.stringify(user) + JSON.stringify(userId))
  },[userId])
  if(loading){
    return(
      <div>
        <button onClick={() => restartApp()}>Loading... click me if this takes a while</button>
        <p>{JSON.stringify(trace)}</p>
      </div>
    )
  }
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ExerciseDash restartApp = {restartApp} minimizeApp = {minimizeApp} connectionStatus={connected} update={updateCount} UserID={userId}/>} />
      </Routes>
    </Router>
  );
}

const components = {
  Header() {
    return (
      <div style={{flexDirection:'row', display:'flex', alignItems:'center', justifyContent:'center'}}>
        <div>
          <img src={require('../../assets/icon.png')} height={100} />
        </div>
        <div style={{marginLeft:20}}>
          <h3>Make sure to enter your email correctly!</h3>
          <p>Otherwise, you will <b>NOT</b>  receive an email confirmation...</p>
        </div>
        
      </div>
    );
  },
  Footer() {
    return (
      <div>
        <p>No email? Check <b>junk</b> and <b>spam</b>! Still no? Create account again.</p>
      </div>
    )
  }
}

export default withAuthenticator(App, {
  initialState : 'signUp',
  components : components
  
});