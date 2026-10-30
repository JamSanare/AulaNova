
pipeline {
    agent any

    stages {
        stage('Install dependencies') {
            steps {
                script {
                    if (isUnix()) {
                        withEnv(["PATH+NODE=/opt/homebrew/bin"]) {
                            sh '''
                                echo "Verificando Node.js y npm..."
                                node --version
                                npm --version

                                rm -rf reports
                                mkdir -p reports

                                echo "Instalando dependencias..."
                                npm ci
                            '''
                        }
                    } else {
                        bat '''
                            node --version
                            npm --version

                            if exist reports rmdir /s /q reports
                            mkdir reports

                            npm ci
                        '''
                    }
                }
            }
        }

        stage('Unit tests') {
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    script {
                        if (isUnix()) {
                            withEnv(["PATH+NODE=/opt/homebrew/bin"]) {
                                sh '''
                                    node --test ^
                                    --test-reporter=junit ^
                                    --test-reporter-destination=reports/unit.xml ^
                                    backend/server.test.js
                                '''
                            }
                        } else {
                            bat '''
                                node --test --test-reporter=junit --test-reporter-destination=reports/unit.xml backend/server.test.js
                            '''
                        }
                    }
                }
            }
        }

        stage('Functional tests') {
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    script {
                        if (isUnix()) {
                            withEnv(["PATH+NODE=/opt/homebrew/bin"]) {
                                sh '''
                                    node --test \
                                    --test-reporter=junit \
                                    --test-reporter-destination=reports/functional.xml \
                                    pruebas/funcional/funcionales.test.js
                                '''
                            }
                        } else {
                            bat '''
                                node --test --test-reporter=junit --test-reporter-destination=reports/functional.xml pruebas/funcional/funcionales.test.js
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            junit testResults: 'reports/**/*.xml',
                  allowEmptyResults: true

            archiveArtifacts artifacts: 'reports/**',
                             allowEmptyArchive: true

            echo 'Pipeline finalizado. Revisar resultados y reportes.'
        }
    }
}
