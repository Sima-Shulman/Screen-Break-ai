pipeline {
    agent any

    environment {
        NODE_EXTRA_CA_CERTS = '/etc/ca-bundle.crt'
        APP_NAME = "screen-break-ai"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code...'
                checkout scm
            }
        }

        stage('Backend: Install & Test') {
            steps {
                dir('Screen-Break-ai/backend') {
                    echo 'Installing backend dependencies...'
                    sh 'npm install'
                    echo 'Running backend tests...'
                    sh 'npm test'
                }
            }
        }

        stage('Extension: Install & Build') {
            steps {
                script {
                    // def extensionDirs = ['extension/background', 'extension/utils']
                    // for (dirName in extensionDirs) {
                    //     dir("Screen-Break-ai/${dirName}") {
                    //         if (fileExists('package.json')) {
                    //             echo "Installing npm packages in ${dirName}"
                    //             sh 'npm install'
                    //         }
                    //     }
                    // }

                    dir('Screen-Break-ai/extension') {
                        if (fileExists('package.json')) {
                            echo "Installing npm packages in popup"
                            sh 'npm install'
                            echo 'Building popup...'
                            sh 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Docker Compose Up') {
            steps {
                echo 'Starting all services with Docker Compose...'
                sh 'docker-compose -f docker-compose.yml up -d --build'
            }
        }

        stage('Run Tests on Services') {
            steps {
                echo 'Waiting for services to be ready...'
                sh 'sleep 10'
                echo 'Running backend tests inside Docker container...'
                sh 'docker-compose exec -T backend npm test'
            }
        }

        // stage('Verify Services') {
        //     steps {
        //         echo 'Verifying services are up...'
        //         sh 'docker-compose ps'
        //         // sh 'curl -f http://localhost:3001/health || curl -f http://localhost:3001 || echo "Service check failed but continuing..."'
        //         echo 'Services verification completed!'
        //     }
        // }

        stage('Docker Compose Down') {
            steps {
                echo 'Stopping all services...'
                sh 'docker-compose -f docker-compose.yml down'
            }
        }
    }

    post {
        success {
            echo'''
                    Pipeline Completed Successfully!
                    All services are running via docker-compose
                    Build #${BUILD_NUMBER} is live!
                '''
        }
        failure {
            echo 'Pipeline failed! Cleaning up...'
            sh 'docker-compose -f docker-compose.yml down || true'
        }
        always {
            echo 'Cleaning up any dangling Docker resources...'
            sh 'docker system prune -f || true'
        }
    }
}
