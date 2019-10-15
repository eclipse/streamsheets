./scripts/deploy.js \
  --tag 1.4 \
  --derivative dev \
  --service @cedalo/service-machines \
  --service @cedalo/service-auth \
  --service @cedalo/service-streams \
  --service @cedalo/service-graphs \
  --service @cedalo/service-opcua \
  --service @cedalo/gateway \
  --service @cedalo/webui
#   --push
