## Running the Backend with Docker

This project includes a Docker setup for running the backend in a containerized environment. Follow these steps to get started:

### Prerequisites

- [Docker](https://www.docker.com/get-started) installed on your machine.

### Steps to Build and Run the Backend

1. **Clone the repository:**
2. Navigate to the `Backend` directory:
   ```bash
   cd Backend
   ```
3. **Build the Docker image:**

   ```bash
   docker build -t neeshar/btp:0.0.1.RELEASE .

   ```

4. Create a .env file (if you don’t have one already) : Refer to the .env.sample file for the required environment variables.

5. **Run the Docker container:**

   ```bash
   docker run -d -p 3000:3000 --env-file .env neeshar/btp:0.0.1.RELEASE

   ```

6. The backend should now be running on `http://localhost:3000`.
7. To stop the container, run:
   ```bash
   docker stop <container_id>
   ```
