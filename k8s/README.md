This dir contains k8s manifests for deploying avokudos to your cluster. Since its a simple app that connects to slack 
via sockets and it doesn't take any other traffic, it just needs a deployment. Feel free to customize as you need.


For redis, its probably best to use a helm chart. See https://github.com/bitnami/charts/tree/main/bitnami/redis for 
bitnami's redis helm chart. I'd recommend making sure you have your redis instance use some kind of persistant volume 
so that you don't lost your kudos tracking. By default, bitnamis redis chart sets this up for you.