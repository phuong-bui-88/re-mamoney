
# Base image
FROM ubuntu:22.04

# Non-interactive mode
ENV DEBIAN_FRONTEND=noninteractive

RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt \
    apt-get update && \
    apt-get install -y --no-install-recommends \
    git curl wget unzip xz-utils zip ca-certificates \
    build-essential openjdk-17-jdk \
    libssl-dev libffi-dev python3-dev \
    netcat-openbsd socat sed coreutils \
    libc6 libc6-dev locales zsh

# Install Node.js 20 (LTS, >=18.0.0 required)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y --no-install-recommends nodejs

# Install React Native and Expo CLIs globally
RUN npm install -g expo-cli react-native-cli

# Set locale to fix UTF-8 encoding issues
RUN echo "en_US.UTF-8 UTF-8" > /etc/locale.gen && \
    locale-gen en_US.UTF-8
ENV LANG=en_US.UTF-8 LANGUAGE=en_US:en LC_ALL=en_US.UTF-8

# Create non-root user
RUN useradd -m -u 1000 rn_dev && \
    chsh -s /bin/zsh rn_dev

# Install Oh-My-Zsh for rn_dev with proper PATH setup
USER rn_dev
RUN sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended && \
    sed -i 's/^ZSH_THEME=.*/ZSH_THEME="robbyrussell"/' /home/rn_dev/.zshrc && \
    sed -i 's/^plugins=.*/plugins=(git npm docker)/' /home/rn_dev/.zshrc && \
    echo 'export PATH="/home/rn_dev/.npm-global/bin:$PATH"' >> /home/rn_dev/.zshrc && \
    mkdir -p /home/rn_dev/.npm-global && \
    npm config set prefix /home/rn_dev/.npm-global

# Set working directory
WORKDIR /workspace

# Install dependencies during build (optional, can skip if mounting)
# RUN npm install

# Default command - interactive shell
USER rn_dev
CMD ["/bin/zsh"]
