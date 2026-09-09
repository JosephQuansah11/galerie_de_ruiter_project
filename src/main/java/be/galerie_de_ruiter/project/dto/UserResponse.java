package be.galerie_de_ruiter.project.dto;

import be.galerie_de_ruiter.project.domain.User;
import be.galerie_de_ruiter.project.domain.UserRole;
import java.util.UUID;
import java.util.Set;

public record UserResponse(UUID id, String email, String displayName, Set<UserRole> role, String firstName, String lastName ) {
	public static UserResponse from(User user) {
		return new UserResponse(user.getId(), user.getEmail(), user.getDisplayName(), user.getRoles(), user.getFirstName(), user.getLastName());
	}
}