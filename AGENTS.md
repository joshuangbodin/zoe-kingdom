1. can we manage user state better. when we update user we should manage the update across the app cleanly 
2. ability for creators to edit or delete their post
3. better offline control
4. when i sign up for the first time, home doesn't fetch my data from firebase correctly 
5. fix this error when working with the bible [Error: Uncaught (in promise, id: 0) Error: Calling the 'runAsync' function has failed
→ Caused by: Error code 20: datatype mismatch] 

Code: construct.js
  2 | var setPrototypeOf = require("./setPrototypeOf.js");
  3 | function _construct(t, e, r) {
> 4 |   if (isNativeReflectConstruct()) return Reflect.construct.apply(null, arguments);
    |                                                                 ^
  5 |   var o = [null];
  6 |   o.push.apply(o, e);
  7 |   var p = new (t.bind.apply(t, o))();
Call Stack
  construct (<native>)
  apply (<native>)
  _construct (node_modules/@babel/runtime/helpers/construct.js:4:65)
  Wrapper (node_modules/@babel/runtime/helpers/wrapNativeSuper.js:15:23)
  construct (<native>)
  _callSuper (node_modules/@babel/runtime/helpers/callSuper.js:5:108)
  constructor (node_modules/expo-modules-core/src/errors/CodedError.ts:11:5)

make the app production ready from start to finish (please let's use sign in with gooogle instead of email and password flow. and we shouldn.t only rely on firebase and when there is data. it should be offline first. do a powerfull production overhaul and refactor fixing all the MVP errors and making it error and problem proof. taking the general user experience to the level of gamified apps like snapchat
)