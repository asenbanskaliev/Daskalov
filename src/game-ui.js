import {LESSONS,createGame} from "./game.js";
export function createGameUI({find,onGesture=()=>{},onCompleted=()=>{}}){
 const game=createGame({onChange:renderProgress});
 const choices=find("lessonChoices"),answers=find("lessonAnswers");
 function renderProgress(){
  const state=game.snapshot();
  find("gameProgress").textContent=state.completed.length+" de "+state.total+" misiones completadas · "+state.points+" puntos";
  for(const button of choices.querySelectorAll("button")){
   button.setAttribute("aria-pressed",String(button.dataset.lesson===state.current));
   button.dataset.completed=String(state.completed.includes(button.dataset.lesson));
  }
 }
 function renderQuestion(lesson){
  find("lessonActivity").hidden=false;
  find("lessonGoal").textContent="Objetivo: "+lesson.objective;
  find("lessonQuestion").textContent=lesson.question;
  answers.replaceChildren();
  for(const option of lesson.options){
   const b=document.createElement("button");
   b.type="button";b.textContent=option;b.className="lesson-answer";
   b.addEventListener("click",()=>{
    const result=game.answer(option);
    find("lessonFeedback").textContent=result.feedback;
    find("lessonHint").textContent=result.hint;
    onGesture(result.correct?"point_board":"talk");
    if(result.correct)Promise.resolve(onCompleted(lesson.id)).catch(()=>{});
   });
   answers.append(b);
  }
  find("lessonFeedback").textContent="";
  find("lessonHint").textContent="";
  onGesture("point_board");
 }
 for(const lesson of LESSONS){
  const button=document.createElement("button");
  button.type="button";button.dataset.lesson=lesson.id;
  button.textContent=lesson.title;button.setAttribute("aria-pressed","false");
  button.addEventListener("click",()=>renderQuestion(game.start(lesson.id)));
  choices.append(button);
 }
 renderProgress();
 return {game,choose:id=>renderQuestion(game.start(id)),restore:rows=>game.restore(rows)};
}
