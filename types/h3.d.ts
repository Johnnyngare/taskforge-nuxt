// types/h3.d.ts
declare module 'h3' {
   interface H3EventContext {
    user?: {
      id: string;
      role: string;
      email: string; // Added email to match full user object from DB
      name?: string; // Added name to match full user object from DB
      profilePhoto?: string; // Added profilePhoto if it's part of your User model
      provider?: string; // Added provider if part of your User model
       // Add other user properties you store
     };
   }
 }