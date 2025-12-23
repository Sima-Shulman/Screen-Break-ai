# FROM jenkins/jenkins:lts

# USER root

# # --- NETFREE CERT INSTALL (COMMENTED OUT) ---
# ADD https://netfree.link/dl/unix-ca2.sh /home/netfree-unix-ca2.sh 
# ADD https://netfree.link/dl/unix-ca.sh /home/netfree-unix-ca.sh 
# RUN cat /home/netfree-unix-ca.sh | sh
# RUN cat /home/netfree-unix-ca2.sh | sh
# ENV NODE_EXTRA_CA_CERTS=/etc/ca-bundle.crt
# ENV REQUESTS_CA_BUNDLE=/etc/ca-bundle.crt
# ENV SSL_CERT_FILE=/etc/ca-bundle.crt
# ADD https://netfree.link/cacert/isp/netfree-anywhere/ca.crt /home/netfree-ca.crt
# RUN keytool -importcert -trustcacerts -noprompt\
#  -alias netfree-ca -file /home/netfree-ca.crt\
#  -keystore /opt/java/openjdk/lib/security/cacerts\
#  -storepass changeit
# # --- END NETFREE CERT INSTALL ---

# # Install Docker and dependencies
# RUN apt-get update && apt-get install -y \
#     docker.io \
#     curl \
#     && rm -rf /var/lib/apt/lists/*

# # Add jenkins user to docker group
# RUN usermod -aG docker jenkins

# # Install Node.js and npm
# RUN apt-get update && apt-get install -y npm nodejs

# USER jenkins
FROM jenkins/jenkins:lts 
USER root 
 
# --- NETFREE CERT INTSALL ---
ADD https://netfree.link/dl/unix-ca2.sh /home/netfree-unix-ca2.sh 
ADD https://netfree.link/dl/unix-ca.sh /home/netfree-unix-ca.sh 
RUN cat /home/netfree-unix-ca.sh | sh
RUN cat /home/netfree-unix-ca2.sh | sh
ENV NODE_EXTRA_CA_CERTS=/etc/ca-bundle.crt
ENV REQUESTS_CA_BUNDLE=/etc/ca-bundle.crt
ENV SSL_CERT_FILE=/etc/ca-bundle.crt
# # --- END NETFREE CERT INTSALL ---
ADD https://netfree.link/cacert/isp/netfree-anywhere/ca.crt /home/netfree-ca.crt
RUN keytool -importcert -trustcacerts -noprompt\
 -alias netfree-ca -file /home/netfree-ca.crt\
 -keystore /opt/java/openjdk/lib/security/cacerts\
 -storepass changeit

RUN apt-get update && apt-get install -y docker.io 
RUN usermod -aG docker jenkins
RUN apt-get install -y npm


USER jenkins