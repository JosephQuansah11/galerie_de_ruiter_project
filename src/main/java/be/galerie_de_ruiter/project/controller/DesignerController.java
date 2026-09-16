package be.galerie_de_ruiter.project.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import be.galerie_de_ruiter.project.dto.DesignerRequest;
import be.galerie_de_ruiter.project.dto.DesignerResponse;
import be.galerie_de_ruiter.project.service.implementation.DesignerServiceImplementation;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/designers")
@RequiredArgsConstructor
public class DesignerController {

    private final DesignerServiceImplementation designerService;

    @GetMapping
    public List<DesignerResponse> getAllDesigners() {
        return designerService.getAllDesigners().stream().map(DesignerResponse::from).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<DesignerResponse> getDesigner(@PathVariable UUID id) {
        return ResponseEntity.ok(DesignerResponse.from(designerService.getDesigner(id)));
    }

    @PostMapping("/add/designer")
    public ResponseEntity<DesignerResponse> assignDesigner(@RequestBody DesignerRequest request) {
        return ResponseEntity.ok(DesignerResponse.from(designerService.saveDesigner(request)));
    }
    
}
