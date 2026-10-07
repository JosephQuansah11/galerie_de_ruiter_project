package be.galerie_de_ruiter.project.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Setter;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
@NoArgsConstructor
@Getter
@Setter 
public class User {
	@Id
	@GeneratedValue(strategy = GenerationType.UUID)
	private UUID id;

	private String keycloakSubject;
	private String email;
	private String displayName;
	private String firstName;
    private String lastName;

	@Column(columnDefinition = "bytea")
	@JsonIgnore
	private byte[] avatarImage;

	@Column(length = 100)
	@JsonIgnore
	private String avatarContentType;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "app_user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Enumerated(EnumType.STRING)
    private Set<UserRole> roles = new HashSet<>();


	public User(String keycloakSubject, String email, String displayName, UserRole role, String firstName, String lastName) {
		this.keycloakSubject = keycloakSubject;
		this.email = email;
		this.displayName = displayName;
		this.roles.add(UserRole.valueOf(role.name()));
		this.firstName = firstName;
		this.lastName = lastName;
	}

    public User(String keycloakSubject, String email, String displayName) {
        this(keycloakSubject, email, displayName, UserRole.USER, null, null);
    }

	public void updateProfile(String email, String displayName, UserRole role) {
		this.email = email;
		this.displayName = displayName;
		this.roles.clear();
		this.roles.add(UserRole.valueOf(role.name()));
	}
}