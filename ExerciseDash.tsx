// @ts-nocheck

import { useEffect,useState, useRef } from 'react';
import icon from '../../../assets/icon.svg';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { app } from 'electron';
import { ipcRenderer } from 'electron/renderer';




const EXERCISES_TO_PULL = 3

export const updateUsersExercise = /* GraphQL */ `
  mutation UpdateUsersExercise($input: UpdateUsersExerciseInput!) {
    updateUsersExercise(input: $input) {
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



export const updateExerciseLog = /* GraphQL */ `
  mutation UpdateExerciseLog($input: UpdateExerciseLogInput!) {
    updateExerciseLog(input: $input) {
      UserID
      timestamp
      exerciseName
      bodyPart
      completed
      timestampCompleted
      __typename
    }
  }
`;

const listExerciseLogs = /* GraphQL */ `
  query ListExerciseLogs(
    $UserID: String!
    $filter: TableExerciseLogFilterInput
    $limit: Int!
    $nextToken: String
  ) {
    listExerciseLogs(
      UserID: $UserID
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        UserID
        timestamp
        exerciseName
        bodyPart
        completed
        timestampCompleted
        __typename
      }
      nextToken
      __typename
    }
  }
`;

const requestExercise = async (UserID) => {
  if(UserID !== "null" && UserID !== null){
      // await fetch("https://5svlsqazprczhjboidlzkvhfyy.appsync-api.us-west-2.amazonaws.com/graphql", {
      //     method : 'POST',
      //     headers: {'Content-Type': 'application/json',
      //               'x-api-key' : 'da2-l25ddq7nvbghfbdp7imeg36ssi'
      //             },
      //     body : JSON.stringify({
      //       query: updateUsersExercise,
      //       variables: {
      //         input : {
      //             UserID : UserID,
      //             RequestedExercise: true
      //         }
      //       }
      //     })
      //   }).then(console.log("Requested"))

  }
  await fetch(baseUrl + "exerciseGen",{
    method:"POST",
    headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
        },
    body : JSON.stringify({
        input : JSON.stringify({
            userID : UserID
        }),
        name: "ExecutingInstantGen" + UserID,
        stateMachineArn : "arn:aws:states:us-west-2:618584891789:stateMachine:InstantGPTExercise"
        
    })
})
  toast(<p>Generating something for you now!</p>)
  
}

export default function ExerciseDash(props) {
    const {UserID, connectionStatus} = props

    const [prevMovements, setPrevMovements] = useState([])
    const [selectedMove, setSelectedMove] = useState(0)
    const [selectedMoveIndex, setSelectedMoveIndex] = useState(0)
    const [ready, setReady] = useState(false)
    const [pullUpdateCount, setPullUpdate] = useState(0)
    const [showStats, setShowStats] = useState(false)

    const pullUpdate = () => {
        setPullUpdate(pullUpdateCount + 1)
    }

    useEffect(() => {
        //updates exercise list
        console.log(props, "updated")
        async function pullLogs(){
            await getExerciseLogs()
           
        }
        pullLogs()

    },[props, pullUpdateCount])
    
    const checkLogStatus= (logs) => {
      console.log("checking logs")
      let allComplete = true
      let lastToDo = EXERCISES_TO_PULL + 1
      for(var i = 0;i< logs.length;i++){
        let curr = logs[i]
        if(curr.completed  == false || curr.completed ==null){
          allComplete = false
          if(i < lastToDo){ 
            lastToDo = i
          }
        }
        
  
      }
      if(lastToDo == EXERCISES_TO_PULL+ 1){
        lastToDo = 0
      }
      return {allComplete : allComplete, toDoNext : lastToDo}
    }

    

    const getExerciseLogs = async() => {
        console.log("getting logs")
        await fetch("https://5svlsqazprczhjboidlzkvhfyy.appsync-api.us-west-2.amazonaws.com/graphql", {
            method : 'POST',
            headers: {'Content-Type': 'application/json',
                      'x-api-key' : 'da2-l25ddq7nvbghfbdp7imeg36ssi'
                    },
            body : JSON.stringify({
              query: listExerciseLogs,
              variables: {
                    UserID: UserID,
                    filter : {
                        UserID : {"eq" : UserID}
                    },
                    limit : EXERCISES_TO_PULL
                    //timestamp: {between: [before, currDate]}
                
              }
            })
          }).then(async res => {
            // setReady(false)
            let states = {}
            const response = (await res.json()).data.listExerciseLogs.items
            console.log(response, "exercise logs")
            if(response.length == 0){
              const placeholder = [{
                "UserID" : UserID,
                "bodyPart" : null,
                "completed" : null,
                "exerciseName" : "Welcome",
                "timestamp" : 0,
                "timestampCompleted" : 0,
                "__typename" : "ExerciseLog"
              }]
              states = checkLogStatus(placeholder)
              
              setPrevMovements(placeholder)
              setSelectedMove(placeholder[0])
              setSelectedMoveIndex(0)
              setReady(true)
            }else{
              states = checkLogStatus(response)
              setPrevMovements(response)
              setSelectedMove(response[0])
              setSelectedMoveIndex(0)
              setReady(true)
              // if(states.toDoNext != 0){
              //   setSelectedMove(response[states.toDoNext])
              // }
            }
            console.log(states, "states")
            if(pullUpdateCount == 0){ //first time open
              console.log("FIRST TIME OPENING APP")
              setShowStats(states.allComplete || states.toDoNext != 0)
            }else{
              console.log("AFTER ALREaDY OPeNING APP")
              setTimeout(() => {
                setShowStats(states.allComplete || states.toDoNext != 0)
              }, 5000)
            }
            
            
            
          })
    }

    const changeMovementType = async (UserID, movementType) => {
        if(movementType == "EXERCISE" || movementType == "STRETCH" || movementType == "YOGA"){

        
            if(UserID !== "null" && UserID !== null){
                await fetch("https://5svlsqazprczhjboidlzkvhfyy.appsync-api.us-west-2.amazonaws.com/graphql", {
                    method : 'POST',
                    headers: {'Content-Type': 'application/json',
                            'x-api-key' : 'da2-l25ddq7nvbghfbdp7imeg36ssi'
                            },
                    body : JSON.stringify({
                    query: updateUsersExercise,
                    variables: {
                        input : {
                            UserID : UserID,
                            Movement: movementType,
                            RequestedExercise: false
                        }
                    }
                    })
                }).then(res => {console.log("Change Movement", res)}).then(requestExercise(UserID))
            }
            toast(<p>Switched to {movementType}</p>)
        }else{
          console.log("no option chosen")
        }
    }

    const reloadApp = () => {
      // display connection status
      // tell main to relaunch app
      // app.relaunch()
      // app.exit()
      props.restartApp()
    }


    if(!ready){
        return(
            <p>Loading...</p>
        )
    }
    return (
      <div className='Main-Body' >
        <div className='Top-Body'>
          <div className='Row' style={{justifyContent:'flex-end', alignContent:'center', alignItems:'center',   marginRight:50, height:100}}>
            <div style={{ backgroundColor: connectionStatus ? '#1769aa' : '#d35400', paddingTop:6, paddingBottom: 6, paddingLeft:10, paddingRight:10, borderRadius:20, alignItems:'center', justifyContent:'center'}}>
              <select style={{fontSize:20,borderColor:'#ffffff00',width: 150, height: 50,alignItems:'center', alignContent:'center',justifyContent:'center', borderRadius:20, backgroundColor:'#ffffff00', fontWeight:'bold',marginRight:20, color:'white'}} name="choice" onChange={event => changeMovementType(UserID, event.target.value)} defaultValue={}>
                <option style={{backgroundColor:'#313131'}} value="DEFAULT" selected>Movement</option>
                <option style={{backgroundColor:'#313131'}} value="EXERCISE" >Exercise</option>
                <option style={{backgroundColor:'#313131'}} value="STRETCH">Stretch</option>
                {/* <option value="third">Third Value</option> */}
              </select>
              
              <button className='button-Setting' style={{fontSize:30,marginRight:20}} onClick={() =>window.open("https://myofficegym.dublabs.biz", '_blank')}>⚙️</button>
              {/* <button className='button-Setting' style={{fontSize:30, backgroundColor: connectionStatus ? null : '#d35400' }}  onClick={() => reloadApp()}>🔄</button> */}
            </div>
          </div>
        </div>
        
        <div className='Tab-Body' style={{borderTopLeftRadius: 20,  marginLeft:'1%', justifySelf:'center',alignSelf:'center', paddingBottom:window.innerHeight * 0.2 - 120}}>
        {/* Left side - Exercise List */}
       
            
          <div className="Column">
              {showStats ? 
              <div>
                <ExerciseStats UserID = {UserID} />
              </div>
              :
              <div> 
                  <ExerciseFrame minimizeApp = {props.minimizeApp} exerciseName = {selectedMove.exerciseName} UserID = {UserID} logtime = {selectedMove.timestamp} pullUpdateTrigger={pullUpdate} completed = {selectedMove.completed} selectedMoveIndex = {selectedMoveIndex}/>
              </div>
              }
              <div className='Section'>
                <h2 style={{color:'#36454F'}}>Your Past Movements <hr/></h2>
                <ul style={{display : 'flex'}}>
                
                    
                    {prevMovements.map((exercise, index) =>
                      <li>
                          <div style={{margin:10, flexDirection:'row'}}>
                              {/* new Date(exercise.timestamp).toLocaleDateString([], {month: 'long', day: 'numeric'}) +", " + */}
                              <button className='button' onClick={() => {setSelectedMove(exercise); setSelectedMoveIndex(index); setShowStats(false)}}>
                                <div className='Row'>
                                  
                                  {exercise.exerciseName} {exercise.completed == true ? '✅' : '⏳'}
                                </div>
                                

                              </button>
                              
                          </div> 
                        </li>
                        )}
                    
                    
                </ul>
              </div>
          </div>
        </div>
      </div>
    );
  }

const baseUrl = "https://hqik9jtqxj.execute-api.us-west-2.amazonaws.com/Dev/"
const API_KEY = "9Cbb8AR3De5ZDINOBgxa02ICzOd7az8k8z2DvvCN"
  
function ExerciseFrame(props){
    const [data, setData] = useState(null)
    const [imgURL, setIMGURL] = useState(null)
    const [description, setDescription] = useState("")
    const [finishedHere, setFinishedHere] = useState(false)
    const [ready, setReady]= useState(false)
    
    const randomActivity = ["- Drink water 💧", "- Blink 10 times 👁️","- Look at greenery (20 secs) 🌲"]

    

    useEffect(() => {
      console.log(finishedHere,"state of complete")
    },[finishedHere])

    console.log(props, "exercise frame props")
    useEffect(() => {
        async function getExercise(){
            await fetch(baseUrl + "exercisedb?exerciseName=" + props.exerciseName,{
                method:"GET",
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'x-api-key': API_KEY
                    }
                
            }).then(async res => {
                const dataExercise = (await res.json()).data.Items[0]
                console.log(dataExercise, "data exericse")
                setData(dataExercise)
                setIMGURL(dataExercise.TutorialLink)
                setDescription(dataExercise.GPTDirections.replace(/\\n/g, '<br>').replace(/\\/g, '').replace(/"/g, ''))
                console.log(dataExercise)
            }).catch(error => {
              console.log(error)
            })
        }
        setReady(false)
        setFinishedHere(props.completed)
        getExercise()
        setReady(true)
    },[props])

    const completedExercise = async (UserID, timestamp, showToast = true, index = -1) => {
        if(UserID !== "null" && UserID !== null && timestamp !== "null" && timestamp !== null){
            await fetch("https://5svlsqazprczhjboidlzkvhfyy.appsync-api.us-west-2.amazonaws.com/graphql", {
                method : 'POST',
                headers: {'Content-Type': 'application/json',
                          'x-api-key' : 'da2-l25ddq7nvbghfbdp7imeg36ssi'
                        },
                body : JSON.stringify({
                  query: updateExerciseLog,
                  variables: {
                    input : {
                        UserID : UserID,
                        timestamp : timestamp,
                        completed : true,
                        timestampCompleted : new Date().getTime()
                    }
                  }
                })
              }).then(async () => {
                console.log("Time last exercising changed")

                  await fetch("https://5svlsqazprczhjboidlzkvhfyy.appsync-api.us-west-2.amazonaws.com/graphql", {
                  method : 'POST',
                  headers: {'Content-Type': 'application/json',
                            'x-api-key' : 'da2-l25ddq7nvbghfbdp7imeg36ssi'
                          },
                  body : JSON.stringify({
                    query: updateUsersExercise,
                    variables: {
                        input : {
                            UserID : UserID,
                            LastExerciseTime : new Date().getTime()
                        }
                    }
                  })
                })
              }
              ).then(console.log("Completed")).then(() => {
                if (!showToast) {
                  // props.pullUpdateTrigger()
                } else {
                  props.pullUpdateTrigger()
                }
                if (index != 0) {
                  props.pullUpdateTrigger()
                }
                
              }).catch(error => console.log(error)).then(() => {
                if(showToast) {
                  setTimeout(() => props.minimizeApp(), 5000)
                }
                
              }
                
              )
        }
        if (showToast) {
          toast(<p>Great Job! Other wellness tips...<br/> <br/>{randomActivity[Math.floor(Math.random() * ((randomActivity.length - 1) - 0 + 1))]}<br/><br/>You're doing amazing!</p>)
        }
        
    }

    

    const Ref = useRef(null);
 
    // The state for our timer
    const [timer, setTimer] = useState("02:00:00");

    const [timerFinished, setTimerFinished] = useState(false)
 
    const getTimeRemaining = (e) => {
        const total =
            Date.parse(e) - Date.parse(new Date());
        const seconds = Math.floor((total / 1000) % 60);
        const minutes = Math.floor(
            (total / 1000 / 60) % 60
        );
        const hours = Math.floor(
            (total / 1000 / 60 / 60) % 24
        );
        return {
            total,
            hours,
            minutes,
            seconds,
        };
    };
 
    const startTimer = (e) => {
        let { total, hours, minutes, seconds } =
            getTimeRemaining(e);
        if (total >= 0) {
            // update the timer
            // check if less than 10 then we need to
            // add '0' at the beginning of the variable
            setTimer(
                // (hours > 9 ? hours : "0" + hours) +
                // ":" +
                (minutes > 9
                    ? minutes
                    : "0" + minutes) +
                ":" +
                (seconds > 9 ? seconds : "0" + seconds)
            );
        } 
        if (total == 0){
          setTimerFinished(true)
        }
    };
 
    const clearTimer = (e) => {
        // If you adjust it you should also need to
        // adjust the Endtime formula we are about
        // to code next
        setTimerFinished(false)
        setTimer("01:30");
 
        // If you try to remove this line the
        // updating of timer Variable will be
        // after 1000ms or 1sec
        if (Ref.current) clearInterval(Ref.current);
        const id = setInterval(() => {
            startTimer(e);
        }, 1000);
        Ref.current = id;
    };
 
    const getDeadTime = () => {
        let deadline = new Date();
 
        // This is where you need to adjust if
        // you entend to add more time
        
        deadline.setSeconds(deadline.getSeconds() + 90); // MAKE 90!
        return deadline;
    };
 
    // We can use useEffect so that when the component
    // mount the timer will start as soon as possible
 
    // We put empty array to act as componentDid
    // mount only
    useEffect(() => {
        clearTimer(getDeadTime());
    }, [props]);
 
    // Another way to call the clearTimer() to start
    // the countdown is via action event from the
    // button first we create function to be called
    // by the button
    const onClickReset = () => {
        clearTimer(getDeadTime());
    };

    const [mouseInEarlyFinish, setMouseInEarlyFinish] = useState(false)

    if(ready && (data != null && imgURL != null)){
      console.log(props.selectedMoveIndex, "EXERCISE INDEX IN FRAME")
      return(
        <div className="Exercise-Body" style={{maxHeight:420}}>
          <ToastContainer position='top-right'  toastStyle={{ backgroundColor: '#28282B' }} theme="dark" autoClose={5000}/>
              <div style={{marginRight:20}}>
                <div style={{backgroundColor:'#8395A7', padding: 20, paddingTop: 10, borderRadius: 20}}>
                  <div className='Row' style={{justifyContent:'space-between'}}>
                    <h3 >{data.exerciseName}</h3>
                    {finishedHere ?
                     <h3 style={{marginHorizontal:10}}>Complete!</h3>
                     :
                     <h3 style={{marginHorizontal:10}}>{timer}</h3>
                    }
                    
                  </div>
                  <div style={{position:'relative', maxWidth:400, maxHeight: 400}}>
                    <img src={imgURL} alt="Exercise Demo" style={{maxWidth:400, height: 400, borderRadius: 20}}/>
                    {finishedHere && props.selectedMoveIndex != 0 ?
                      null 
                    :
                    timerFinished || finishedHere ?
                      <div style={{position:'absolute',bottom : 75, left: 75, top: 75, right: 75, borderRadius: 20, height:250, width:250, opacity:0.95, background:'#e8e9ed', justifyContent:'center', alignItems:'center', alignContent:'center', flex:1}}>
                      
                      <div style={{position:'absolute', left:40, bottom:50, justifyContent:'space-evenly', flex:1}}>
                          <h4 style={{color:'#313131'}}>Good Job!</h4>
                          <button style={{marginBottom:20}} className='buttonOther' onClick={() => {completedExercise(props.UserID, props.logtime, false, props.selectedMoveIndex).then(() => requestExercise(props.UserID))}}>Another one!</button>
                          {finishedHere ?
                            null
                          :
                            <button className='buttonOther' onClick={() => onClickReset()}>Restart Timer</button>
                          }
                          
                        </div>
                        
                      </div>
                      :
                      <div onMouseEnter={() => setMouseInEarlyFinish(true)} onMouseLeave={() => setMouseInEarlyFinish(false)} style={{position:'absolute',bottom : 75, left: 75, top: 205, right: 75, borderRadius: 20, height:150, width:250, opacity: mouseInEarlyFinish ? 0.8 : 0.3, background:'#e8e9ed', justifyContent:'center', alignItems:'center', alignContent:'center', flex:1}}>
                      
                        <div style={{position:'absolute', left:40, bottom:30, justifyContent:'space-evenly', flex:1}}>
                          
                          <button style={{marginBottom:20}} className='buttonOther' onClick={() => {completedExercise(props.UserID, props.logtime, false, props.selectedMoveIndex);setFinishedHere(true); setTimerFinished(true)}}>Finished early!</button>
  
                        </div>
                        
                      </div>
                    
                    }
                  </div>
                  
                  
                </div>
                
              </div>
              <div style={{marginLeft: 20, minHeight:400,paddingTop:20, flex:1}} className='Column'>
                <div style={{marginLeft: 5, paddingRight:5, flex:1}}>
                  <h2 style={{color:'#313131'}}>Description</h2>
                  <p style={{height: 220, maxWidth:350,overflowY:description.length > 500 ? 'scroll' : 'auto', color:'ButtonText'}} dangerouslySetInnerHTML={{ __html: description.includes("Description") ? description.split("Description:")[1].trim().replace("Repetitions:","<b>Repetitions:</b>").replace("Sets:","<b>Sets:</b>") : description.trim().replace("Repetitions:","<b>Repetitions:</b>").replace("Sets:","<b>Sets:</b>") }}/> 
                </div>
                <div className='Column' style={{flex:1}}>
                  <div>
                    <p style={{textAlign:'right', color: '#313131', fontWeight:'bold', fontSize:12, marginRight:5}}>Want to do something else?</p>
                  </div>
                  <div className='Row' style={{marginBottom: 10}} >

                    <button style={{marginRight:20}} className='buttonAction' onClick={() => {completedExercise(props.UserID, props.logtime);setFinishedHere(true)}}>Complete Session!</button> 
                    
                    <button className='buttonOther' onClick={() => requestExercise(props.UserID)}>Request Movement</button>
                  </div>
                
                </div>
              </div>
                
        </div>
      )
    }else{
        return(
          <div className="Exercise-Body" style={{maxHeight:420}}>
          <ToastContainer position='top-right'  toastStyle={{ backgroundColor: '#28282B' }} theme="dark" autoClose={5000}/>
              <div style={{marginRight:20}}>
                <div style={{backgroundColor:'#8395A7', padding: 20, paddingTop: 10, borderRadius: 20}}>
                  <div className='Row' style={{justifyContent:'space-between'}}>
                    <h3 >◌</h3>
                    {finishedHere ?
                     <h3 style={{marginHorizontal:10}}>Complete!</h3>
                     :
                     <h3 style={{marginHorizontal:10}}>◌</h3>
                    }
                    
                  </div>
                  
                  <div style={{width:400, height: 400, borderRadius: 20, justifyContent:'center', alignItems:'center',textAlign:'center'}}>
                  ◌
                  </div>
                  
                </div>
                
              </div>
              <div style={{marginLeft: 20, minHeight:400,paddingTop:20, flex:1}} className='Column'>
                
                <div className='Column' style={{flex:1}}>
                  <div>
                    <p style={{textAlign:'right', color: '#313131', fontWeight:'bold', fontSize:12, marginRight:5}}>Want to do something else?</p>
                  </div>
                  <div className='Row' style={{marginBottom: 10}} >

                    <button style={{marginRight:20}} className='buttonAction' onClick={() => {completedExercise(props.UserID, props.logtime);setFinishedHere(true)}}>Complete!</button> 
                    
                    <button className='buttonOther' onClick={() => requestExercise(props.UserID)}>Request Movement</button>
                  </div>
                
                </div>
              </div>
                
        </div>
        )
    }
    
    
}

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { faker } from '@faker-js/faker';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);


export const options = {
  responsive: true,
  scales: {
    y:{
      display:false
    },
    x:{
      grid:{
        display:false
      }
    }
  },
  plugins: {
      
    title: {
      display: true,
      text: '',
    },
    legend:{
      display:false
    }
    
  },
};

// const labels = ['January', 'February', 'March', 'April', 'May', 'June', 'July'];

// export const dataGraph = {
//   labels,
//   datasets: [
//     {
//       label: 'Dataset 1',
//       data: labels.map(() => faker.datatype.number({ min: 0, max: 1000 })),
//       backgroundColor: 'rgba(255, 99, 132, 0.5)',
//     },
//     {
//       label: 'Dataset 2',
//       data: labels.map(() => faker.datatype.number({ min: 0, max: 1000 })),
//       backgroundColor: 'rgba(53, 162, 235, 0.5)',
//     },
//   ],
// };

function ExerciseStats(props){
  //const [data, setData] = useState([])


  const {UserID} = props
  const [labels, setLabels]=useState([])
  const [complete, setComplete] = useState(0)
  const [completeArrVar, setCompleteArr] = useState([])
  const [incomplete, setIncomplete] =useState(0)
  const [graphData, setGraphData]=useState({})
  const [ready, setReady]=useState(false)
  const [streak,setStreak]=useState(0)
  const [lastMovementTime, setLastMovementTime]=useState(new Date())

  // stats - show streaks and whatnot

  const getExerciseLogs = async() => {
    console.log("getting logs")
    await fetch("https://5svlsqazprczhjboidlzkvhfyy.appsync-api.us-west-2.amazonaws.com/graphql", {
        method : 'POST',
        headers: {'Content-Type': 'application/json',
                  'x-api-key' : 'da2-l25ddq7nvbghfbdp7imeg36ssi'
                },
        body : JSON.stringify({
          query: listExerciseLogs,
          variables: {
                UserID: UserID,
                filter : {
                    UserID : {"eq" : UserID}
                },
                limit : 30
                //timestamp: {between: [before, currDate]}
            
          }
        })
      }).then(async res => {
        // setReady(false)
        const response = (await res.json()).data.listExerciseLogs.items // return array
        if(response.length>0){
          setLastMovementTime(new Date(response[0].timestamp))
        }
        
        console.log(response)
        let dateDict={}
        let dateDictIncomplete={}
        let dates = []
        let streak = 0
        let continueStreak= true
        let totComplete = 0
        let totIncomplete= 0
        for(var i = 0; i< response.length ; i++){
          let point = response[i]
          console.log(point)
          let date = new Date(point.timestamp)
          console.log(date.toLocaleDateString(undefined, { weekday:'short'}))
          let dateStr = date.toLocaleDateString(undefined, { weekday:'short'}) +   " " +date.toLocaleDateString(undefined, { day:'numeric'})
          if(dates.includes(dateStr)==false){
            dates.push(dateStr)
          }
          
          if(point.completed){
            if(dateStr in dateDict){
              //console.log("already there")
              dateDict[dateStr]+=1
            }else{
              dateDict[dateStr]= 1
              
            }
            if(continueStreak){
              streak++
            }
            totComplete ++
          }else{
            continueStreak = false
            if(dateStr in dateDictIncomplete){
              //console.log("already there")
              dateDictIncomplete[dateStr]+=1
            }else{
              dateDictIncomplete[dateStr]= 1
            }
            totIncomplete++
          }
          //console.log(dates)
        }
        setLabels(dates)
        setComplete(totComplete)
        setIncomplete(totIncomplete)
        setStreak(streak)
        let completeArr=[]
        let incompleteArr=[]
        for(var i =0;i<dates.length;i++){
          let date =dates[i]
          if(date in dateDict){
            completeArr.push(dateDict[date])
          }else{
            completeArr.push(0)
          }

          if(date in dateDictIncomplete){
            incompleteArr.push(dateDictIncomplete[date])
          }else{
            incompleteArr.push(0)
          }
        }
        dates.reverse()
        completeArr.reverse()
        incompleteArr.reverse()
        setCompleteArr(completeArr)
        let data = {
          labels :dates,
          datasets: [
            {
              label: 'Incomplete',
              data: incompleteArr,
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
              borderRadius:20
              
            },
            {
              label: 'Complete',
              data: completeArr,
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
              borderRadius:20
            },
          ]
        };
        
        setGraphData(data)
        setReady(true)
        console.log(data)
      })
  }

  useEffect(()  =>{
    setReady(false)
    getExerciseLogs()
  },[])

  // time next exercise will come

  // request exercise

  

  const getAvgOfArr = (arr) => {
    if(arr.length == 0){
      return 0
    }
    let s = 0
    for(var i = 0;i < arr.length; i++){
      s += arr[i]
    }
    return (s / arr.length).toFixed(1)
  }

  if(ready){
    console.log(graphData, "ready")
    return(
      <div  className="Exercise-Body" style={{maxHeight:420}}>
        <ToastContainer position='top-right'  toastStyle={{ backgroundColor: '#28282B' }} theme="dark" autoClose={5000}/>
        <div style={{marginRight:20}}>
                <div style={{backgroundColor:'white', padding: 20, paddingTop: 10, borderRadius: 20}}>
                  <div className='Row' style={{justifyContent:'space-between'}}>
                    <h3 style={{color: '#313131'}}>Last {complete + incomplete} movements</h3>
                    <h3 style={{marginHorizontal:10, color:'#313131'}}>{complete + "/" + (complete+incomplete)}</h3>
                  </div>
                  <div style={{backgroundColor : 'white'}}>
                    <Bar height={410} width={400} options={options} data={graphData} />
                  </div>
                  
                  
                </div>
                
              </div>
        
        <div style={{flex:1,width:'50%', height:'100%',justifyContent:'space-between', alignContent:'space-between'}} className='column'>
          <h2 style={{marginHorizontal:0, color:'#313131'}}>Your streak: {streak}🔥</h2>
          {complete > 0 ?
            <h2 style={{marginHorizontal:10, color:'#313131'}}>Your last movement<p style={{color: '#313131', fontWeight:'bold', fontSize:15, marginLeft:0}}>- {lastMovementTime.toLocaleString(undefined,{dateStyle:'medium'})} - {lastMovementTime.toLocaleString(undefined,{timeStyle:'short'})}</p><p style={{color: '#313131', fontWeight:'bold', fontSize:15, marginLeft:0}}>- Expect one soon if your calendar is empty!</p></h2>
            :
            null
          }
          <br/>
          <br/>
          <br/>
          <p style={{marginHorizontal:10, color:'#313131', fontWeight:'bold'}}>Current pace: <span style={{color:getAvgOfArr(completeArrVar) >= 5 ? '#2ecc71' : 'red'}}>{getAvgOfArr(completeArrVar)}</span> movements/day</p>
          
          <div className='Row' style={{marginBottom: 10}} >
              <button className='buttonOther' onClick={() => requestExercise(props.UserID)}>Request Movement</button>
            </div>
        </div>
        
      </div>
    )
  }else{
    return(
      <div>loading...</div>
    )
  }
  
}