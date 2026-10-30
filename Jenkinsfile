pipeline {
    agent any

    environment {
        PATH = '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin'
    }

    stages {
        stage('Preparar proyecto') {
            steps {
                sh '''
                    echo "Verificando Node.js y npm..."
                    node --version
                    npm --version

                    echo "Preparando reportes..."
                    rm -rf reports
                    mkdir -p reports

                    echo "Instalando dependencias..."
                    npm ci
                '''
            }
        }

        stage('Pruebas unitarias') {
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    sh '''
                        node --test \
                        --test-reporter=junit \
                        --test-reporter-destination=reports/unit.xml \
                        backend/server.test.js
                    '''
                }
            }
        }

        stage('Pruebas funcionales') {
            steps {
                catchError(buildResult: 'FAILURE', stageResult: 'FAILURE') {
                    sh '''
                        node --test \
                        --test-reporter=junit \
                        --test-reporter-destination=reports/functional.xml \
                        pruebas/funcional/funcionales.test.js
                    '''
                }
            }
        }
    }

    post {
        always {
            junit testResults: 'reports/*.xml', allowEmptyResults: true
            archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true
            echo 'Pipeline finalizado. Revisar resultados y reportes.'
        }
    }
}
