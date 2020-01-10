# Scribe - API Documentation
- A transcript note-taking app with organizational features that allow users to effectively record and store transcripts
- Deployed project can be found [here](https://notaking-with-scribe.netlify.com/)
- API deployed at https://hackathon-livenotes.herokuapp.com/

*Testing to be implemented...*

# Installation Instructions

To get the server running locally:

- Clone this repo
- **yarn** to install required dependencies
- **yarn server** to start the server with nodemon

# Endpoints

## USERS

| Method | Endpoint | Token required | Description | Attached to req | Returned |
| -:| :-| :-: | :- | :- | :- |
| POST | `/users` | No | Create new user | `{ email, username, password }` | User object + token |
| POST | `/login` | No | Authenticate user | `{ username, password }` | User object + token |
| GET | `/refresh` | Yes | Retrieve user data | N/A | User object |

## TRANSCRIPTS

| Method | Endpoint | Token required | Description | Attached to req | Returned |
| -:| :-| :-: | :- | :- | :- |
| GET | `/transcripts/mine` | Yes | Retrieve user's transcripts | N/A | Token bearer's transcripts |
| GET | `/transcripts/:id` | Yes | Retrieve transcript by id | A transcript `id` in paramas | Transcript object
| POST | `/transcripts` | Yes | Create new transcript | `{ title (string), data (string), recordingLength (optional int) , isGroup (optional bool), parent (optional string), sharedWith (optional array[{ userId (string), edit(bool) }]) }` | Token bearer's transcripts |
| PUT | `/transcripts/:id` | Yes | Update existing transcript | `{ title (optional string), data (optional string) }` | Newly updated transcript |
| POST | `/transcripts/share/:id` | Yes | Add member(s) to a transcript | params: `id` (transcript ID), body: `{ users: [ { userId (string), edit (bool) }, ... ] }` | Newly updated transcript |
| PUT | `/transcripts/share/:id` | Yes | Update member permissions on transcript | params: `id` (transcript ID), body: `{ userId (string), edit(bool) }` | Newly updated transcript |
| DELETE | `/transcripts/share/:id` | Yes | Remove member from transcript | params: `id` (transcript ID), body: `{ userId (string) }` | Newly updated transcript |
| DELETE | `/transcripts/:id` | Yes | Delete transcript | params: `id` (transcript ID) | Status 200 OK |

# Data Models

## User
```
{
  id: String - Auto-generated,
  username: String (required, unique),
  email: String (required, unique),
  password: String (required, min 8 chars),
  transcripts: [ObjectId (ref: Transcript)]
}
```

## Transcript
```
{
  id: String - Auto-generated,
  title: String (required),
  creator: ObjectId - Auto-assigned (creator of this transcript),
  createdAt: String - Auto-generated,
  recordingLength: Number (optional, length of recording in seconds),
  data: String (required, the actual transcript),
  parent: ObjectId (optional, ID of this transcripts parent),
  isGroup: Boolean (optional, is this transcript parent to others i.e a folder?),
  group: [ObjectId (ref: Transcript)] - Auto-assigned (children of this transcript),
  sharedWith: [     (Users with access to this transcript)
    {
      user: ObjectId (ref: Transcript) (required),
      edit: Boolean (required, can this user edit this transcript?)
    },
    ...
  ]
}
```

## Environment Variables
In order for the app to function correctly, the developer must set up their own environment variables.

Create a .env file that includes the following:
```
* PORT

* DB  (MongoDB connection string)

* JWT_SECRET

```

--- 
## Contributing

When contributing to this repository, please first discuss the change you wish to make via issue, email, or any other method with the owners of this repository before making a change.

Please note we have a [code of conduct](./code_of_conduct.md). Please follow it in all your interactions with the project.

### Issue/Bug Request

 **If you are having an issue with the existing project code, please submit a bug report under the following guidelines:**
 - Check first to see if your issue has already been reported.
 - Check to see if the issue has recently been fixed by attempting to reproduce the issue using the latest master branch in the repository.
 - Create a live example of the problem.
 - Submit a detailed bug report including your environment & browser, steps to reproduce the issue, actual and expected outcomes,  where you believe the issue is originating from, and any potential solutions you have considered.

### Feature Requests

We would love to hear from you about new features which would improve this app and further the aims of our project. Please provide as much detail and information as possible to show us why you think your new feature should be implemented.

### Pull Requests

If you have developed a patch, bug fix, or new feature that would improve this app, please submit a pull request. It is best to communicate your ideas with the developers first before investing a great deal of time into a pull request to ensure that it will mesh smoothly with the project.

Remember that this project is licensed under the MIT license, and by submitting a pull request, you agree that your work will be, too.

#### Pull Request Guidelines

- Ensure any install or build dependencies are removed before the end of the layer when doing a build.
- Update the README.md with details of changes to the interface, including new plist variables, exposed ports, useful file locations and container parameters.
- Ensure that your code conforms to our existing code conventions and test coverage.
- Include the relevant issue number, if applicable.
- You may merge the Pull Request in once you have the sign-off of two other developers, or if you do not have permission to do that, you may request the second reviewer to merge it for you.

### Attribution

These contribution guidelines have been adapted from [this good-Contributing.md-template](https://gist.github.com/PurpleBooth/b24679402957c63ec426).

## Frontend Documentation

See [here](https://github.com/Breath-Taken/BreathTaken-FE) for details on the frontend of our project.
