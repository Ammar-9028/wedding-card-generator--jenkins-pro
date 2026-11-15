pipeline {
  agent any
  environment {
    TOMCAT_WEBAPPS = '/opt/tomcat9/webapps'   // Tomcat 9 install path on the EC2 box
    TOMCAT_PORT    = '9090'
  }
  options { timestamps(); disableConcurrentBuilds() }
  stages {
    stage('Checkout') { steps { checkout scm } }
    stage('JS syntax check') {
      steps { sh '''
        if command -v node >/dev/null 2>&1; then
          for f in src/main/webapp/assets/js/*.js; do node --check "$f"; done
        else
          echo "node not installed, skipping JS check"
        fi
      ''' }
    }
    stage('Build WAR') { steps { sh 'mvn -B clean package' } }
    stage('Verify WAR') { steps { sh 'test -f target/shaadi-cards.war && unzip -l target/shaadi-cards.war | grep -q "WEB-INF/classes/com/shaadi/cards/HealthServlet.class"' } }
    stage('Archive') { steps { archiveArtifacts artifacts: 'target/shaadi-cards.war', fingerprint: true } }
    stage('Deploy to Tomcat 9') {
      steps { sh '''
        cp target/shaadi-cards.war "$TOMCAT_WEBAPPS/shaadi-cards.war"
        for i in $(seq 1 30); do
          curl -fs "http://localhost:$TOMCAT_PORT/shaadi-cards/health" && echo " <- deployed" && exit 0
          sleep 3
        done
        echo "Health check failed"; exit 1
      ''' }
    }
  }
  post { success { echo 'Open: http://<EC2-IP>:9090/shaadi-cards/' } }
}
