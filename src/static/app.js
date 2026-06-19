document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and dropdown options
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Participants section
        const participantsDiv = document.createElement("div");
        participantsDiv.className = "participants";

        const participantsHeader = document.createElement("p");
        participantsHeader.className = "participants-header";
        participantsHeader.innerHTML = "<strong>Participants:</strong>";
        participantsDiv.appendChild(participantsHeader);

        if (details.participants && details.participants.length > 0) {
          const ul = document.createElement("ul");
          ul.className = "participants-list";

          details.participants.forEach((participant) => {
            const li = document.createElement("li");
            li.className = "participant-chip";

            const nameSpan = document.createElement("span");
            nameSpan.textContent = participant;
            li.appendChild(nameSpan);

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "participant-delete";
            deleteButton.title = `Unregister ${participant}`;
            deleteButton.innerHTML = "&times;";
            deleteButton.addEventListener("click", () => {
              showConfirmationDialog(participant, name);
            });
            li.appendChild(deleteButton);

            ul.appendChild(li);
          });

          participantsDiv.appendChild(ul);
        } else {
          const empty = document.createElement("p");
          empty.className = "info";
          empty.textContent = "No participants yet";
          participantsDiv.appendChild(empty);
        }

        activityCard.appendChild(participantsDiv);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  function showConfirmationDialog(participant, activityName) {
    const overlay = document.createElement("div");
    overlay.className = "confirmation-overlay";

    const dialog = document.createElement("div");
    dialog.className = "confirmation-dialog";

    const message = document.createElement("p");
    message.textContent = `Are you sure you want to unregister ${participant}?`;
    dialog.appendChild(message);

    const actions = document.createElement("div");
    actions.className = "confirmation-actions";

    const noButton = document.createElement("button");
    noButton.type = "button";
    noButton.className = "button-secondary";
    noButton.textContent = "No";
    noButton.addEventListener("click", () => {
      overlay.remove();
    });

    const yesButton = document.createElement("button");
    yesButton.type = "button";
    yesButton.className = "button-danger";
    yesButton.textContent = "Yes";
    yesButton.addEventListener("click", async () => {
      await unregisterParticipant(activityName, participant);
      overlay.remove();
    });

    actions.appendChild(noButton);
    actions.appendChild(yesButton);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  async function unregisterParticipant(activityName, email) {
    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activityName)}/unregister?email=${encodeURIComponent(email)}`,
        { method: "POST" }
      );

      const result = await response.json();
      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        messageDiv.classList.remove("hidden");
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "Unable to unregister participant.";
        messageDiv.className = "error";
        messageDiv.classList.remove("hidden");
      }

      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to unregister participant. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering participant:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
